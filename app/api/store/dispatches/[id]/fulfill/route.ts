import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DispatchStatus } from '@prisma/client';
import { auth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // if (
    //   !['ADMIN', 'STORE_KEEPER', 'OPERATION_MANAGER'].includes(
    //     session.user.role,
    //   )
    // ) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    // Find the dispatch request
    const dispatch = await prisma.storeDispatch.findUnique({
      where: { id },
    });

    if (!dispatch) {
      return NextResponse.json(
        { error: 'Dispatch not found' },
        { status: 404 },
      );
    }

    if (dispatch.status !== ('REQUESTED' as any)) {
      return NextResponse.json(
        {
          error: 'Only REQUESTED dispatches can be fulfilled via this endpoint',
        },
        { status: 400 },
      );
    }

    const items = dispatch.items as Array<{
      storeItemId: string;
      itemNumber: string;
      name: string;
      unit: string;
      quantity: number;
    }>;

    // Validate real-time stock
    for (const item of items) {
      const storeItem = await prisma.storeItem.findUnique({
        where: { id: item.storeItemId },
        select: { id: true, name: true, itemNumber: true, quantity: true },
      });

      if (!storeItem) {
        return NextResponse.json(
          { error: `Store item not found: ${item.storeItemId}` },
          { status: 400 },
        );
      }

      if (storeItem.quantity < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${storeItem.name}" (${storeItem.itemNumber}). Available: ${storeItem.quantity}, requested: ${item.quantity}`,
          },
          { status: 400 },
        );
      }
    }

    // Complete fulfillment in a transaction
    const updatedDispatch = await prisma.$transaction(async (tx) => {
      // 1. Update status
      const completed = await tx.storeDispatch.update({
        where: { id },
        data: {
          status: 'PENDING',
          dispatchedBy: session.user.name as string,
        },
      });

      // 2. Decrement stock
      for (const item of items) {
        await tx.storeItem.update({
          where: { id: item.storeItemId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 3. Update related Order status to DISPATCHED if linked
      if (dispatch.orderId) {
        await tx.order.update({
          where: { id: dispatch.orderId },
          data: { status: 'DISPATCHED' },
        });
      }

      return completed;
    });

    // Log the approval
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Fulfilled Store Dispatch Request',
        module: 'Store',
        details: {
          dispatchId: updatedDispatch.id,
          dispatchNumber: updatedDispatch.dispatchNumber,
        },
      },
    });

    return NextResponse.json(updatedDispatch);
  } catch (error) {
    console.error('Error fulfilling dispatch request:', error);
    return NextResponse.json(
      { error: 'Failed to fulfill dispatch request' },
      { status: 500 },
    );
  }
}
