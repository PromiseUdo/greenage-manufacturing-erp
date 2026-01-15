// src/app/api/inventory/issuances/route.ts

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
    const materialId = searchParams.get('materialId') || '';
    const orderId = searchParams.get('orderId') || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (materialId) {
      where.materialId = materialId;
    }

    if (orderId) {
      where.orderId = orderId;
    }

    const [issuances, total] = await Promise.all([
      prisma.materialIssuance.findMany({
        where,
        include: {
          material: true,
        },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.materialIssuance.count({ where }),
    ]);

    return NextResponse.json({
      issuances,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching issuances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issuances' },
      { status: 500 }
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
    const { materialId, quantity, batchNumber, issuedTo, purpose, orderId } =
      body;

    if (!materialId || !quantity || !batchNumber || !issuedTo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check material availability
    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    if (material.currentStock < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      );
    }

    // Create issuance and update stock in a transaction
    const [issuance] = await prisma.$transaction([
      prisma.materialIssuance.create({
        data: {
          materialId,
          quantity,
          batchNumber,
          issuedTo,
          issuedBy: session.user.name as string,
          purpose,
          orderId,
        },
        include: {
          material: true,
        },
      }),
      prisma.material.update({
        where: { id: materialId },
        data: {
          currentStock: {
            decrement: quantity,
          },
        },
      }),
    ]);

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Material Issued',
        module: 'Inventory',
        details: {
          materialId,
          materialName: material.name,
          quantity,
          issuedTo,
        },
      },
    });

    return NextResponse.json(issuance, { status: 201 });
  } catch (error) {
    console.error('Error creating issuance:', error);
    return NextResponse.json(
      { error: 'Failed to create issuance' },
      { status: 500 }
    );
  }
}
