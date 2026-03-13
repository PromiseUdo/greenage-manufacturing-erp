// app/api/inventory/material-requisitions/route.ts
// Inventory-side: list all pending/partial production material requisitions
// so the store keeper can see what needs to be fulfilled

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING,PARTIALLY_FULFILLED';
    const statuses = status.split(',') as any[];

    const requisitions = await prisma.productionMaterialRequisition.findMany({
      where: {
        status: { in: statuses },
      },
      include: {
        productionOrder: {
          select: {
            id: true,
            orderNumber: true,
            quantity: true,
            status: true,
            product: {
              select: { id: true, name: true, productNumber: true, category: true },
            },
          },
        },
        productReturn: {
          select: {
            id: true,
            returnNumber: true,
            quantity: true,
            product: {
              select: { id: true, name: true, productNumber: true, category: true },
            },
          },
        },
        requestedBy: { select: { id: true, name: true, email: true } },
        fulfilledBy: { select: { id: true, name: true } },
        items: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                partNumber: true,
                unit: true,
                currentStock: true,
                category: true,
                reorderLevel: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute stats
    const totalPending = requisitions.filter((r) => r.status === 'PENDING').length;
    const totalPartial = requisitions.filter((r) => r.status === 'PARTIALLY_FULFILLED').length;

    return NextResponse.json({ requisitions, stats: { totalPending, totalPartial } });
  } catch (error) {
    console.error('Error fetching material requisitions:', error);
    return NextResponse.json({ error: 'Failed to fetch requisitions' }, { status: 500 });
  }
}
