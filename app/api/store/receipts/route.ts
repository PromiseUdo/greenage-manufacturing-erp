// app/api/store/receipts/route.ts

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
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { receiptNumber: { contains: search, mode: 'insensitive' } },
        { source: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { receivedBy: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [receipts, total] = await Promise.all([
      prisma.storeReceipt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.storeReceipt.count({ where }),
    ]);

    return NextResponse.json({
      receipts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching store receipts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store receipts' },
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

    if (
      !['ADMIN', 'STORE_KEEPER', 'OPERATION_MANAGER'].includes(
        session.user.role,
      )
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { source, referenceNumber, items, notes } = body;

    if (!source || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Source and at least one item are required' },
        { status: 400 },
      );
    }

    // Generate receipt number
    const lastReceipt = await prisma.storeReceipt.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { receiptNumber: true },
    });

    const receiptCount = lastReceipt
      ? parseInt(lastReceipt.receiptNumber.split('-')[2]) + 1
      : 1;
    const receiptNumber = `SRN-${new Date().getFullYear()}-${receiptCount
      .toString()
      .padStart(4, '0')}`;

    // Build item snapshots with names for the JSON field
    const itemSnapshots: Array<{
      storeItemId: string;
      itemNumber: string;
      name: string;
      unit: string;
      quantity: number;
      batchNumber: string | null;
      notes: string | null;
    }> = [];
    for (const item of items) {
      const storeItem = await prisma.storeItem.findUnique({
        where: { id: item.storeItemId },
        select: { id: true, name: true, itemNumber: true, unit: true },
      });

      if (!storeItem) {
        return NextResponse.json(
          { error: `Store item not found: ${item.storeItemId}` },
          { status: 400 },
        );
      }

      itemSnapshots.push({
        storeItemId: storeItem.id,
        itemNumber: storeItem.itemNumber,
        name: storeItem.name,
        unit: storeItem.unit,
        quantity: item.quantity,
        batchNumber: item.batchNumber || null,
        notes: item.notes || null,
      });
    }

    // Create receipt and update stock in transaction
    const receipt = await prisma.$transaction(async (tx) => {
      const newReceipt = await tx.storeReceipt.create({
        data: {
          receiptNumber,
          source,
          referenceNumber: referenceNumber || null,
          items: itemSnapshots,
          receivedBy: session.user.name as string,
          notes: notes || null,
        },
      });

      // Update each store item's quantity
      for (const item of items) {
        await tx.storeItem.update({
          where: { id: item.storeItemId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });
      }

      return newReceipt;
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Created Store Receipt',
        module: 'Store',
        details: {
          receiptId: receipt.id,
          receiptNumber,
          source,
          itemCount: items.length,
        },
      },
    });

    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    console.error('Error creating store receipt:', error);
    return NextResponse.json(
      { error: 'Failed to create store receipt' },
      { status: 500 },
    );
  }
}
