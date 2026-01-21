// src/app/api/inventory/grn/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const supplierId = searchParams.get('supplierId') || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (supplierId) {
      where.supplierId = supplierId;
    }

    const [grns, total] = await Promise.all([
      prisma.gRN.findMany({
        where,
        include: {
          supplier: true,
          batches: {
            include: {
              material: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.gRN.count({ where }),
    ]);

    return NextResponse.json({
      grns,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching GRNs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GRNs' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'STORE_KEEPER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { supplierId, invoiceNumber, items, notes } = body;

    if (!supplierId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Supplier and items are required' },
        { status: 400 },
      );
    }

    // Generate GRN number
    const lastGRN = await prisma.gRN.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { grnNumber: true },
    });

    const grnCount = lastGRN
      ? parseInt(lastGRN.grnNumber.split('-')[2]) + 1
      : 1;
    const grnNumber = `GRN-${new Date().getFullYear()}-${grnCount
      .toString()
      .padStart(4, '0')}`;

    // Create GRN and update stock in transaction
    const grn = await prisma.$transaction(async (tx) => {
      // Create GRN
      const newGRN = await tx.gRN.create({
        data: {
          grnNumber,
          supplierId,
          invoiceNumber,
          items,
          receivedBy: session.user.name as string,
          notes,
        },
      });

      // Create batches and update stock for each item
      for (const item of items) {
        const {
          materialId,
          quantity,
          batchNumber,
          expiryDate,
          supplierBatchNo,
        } = item;

        // Create batch
        await tx.materialBatch.create({
          data: {
            materialId,
            batchNumber,
            quantity,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            supplierBatchNo,
            grnId: newGRN.id,
          },
        });

        // Update material stock
        await tx.material.update({
          where: { id: materialId },
          data: {
            currentStock: {
              increment: quantity,
            },
          },
        });
      }

      return newGRN;
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Created GRN',
        module: 'Inventory',
        details: {
          grnId: grn.id,
          grnNumber,
          itemCount: items.length,
        },
      },
    });

    // Fetch complete GRN with relations
    const completeGRN = await prisma.gRN.findUnique({
      where: { id: grn.id },
      include: {
        supplier: true,
        batches: {
          include: {
            material: true,
          },
        },
      },
    });

    return NextResponse.json(completeGRN, { status: 201 });
  } catch (error) {
    console.error('Error creating GRN:', error);
    return NextResponse.json(
      { error: 'Failed to create GRN' },
      { status: 500 },
    );
  }
}
