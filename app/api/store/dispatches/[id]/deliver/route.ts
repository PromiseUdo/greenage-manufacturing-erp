import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { DispatchStatus } from '@prisma/client';

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
    //   !['ADMIN', 'STORE_KEEPER', 'OPERATION_MANAGER', 'DISPATCH_OFFICER'].includes(
    //     session.user.role,
    //   )
    // ) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const dispatch = await prisma.storeDispatch.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!dispatch) {
      return NextResponse.json(
        { error: 'Dispatch not found' },
        { status: 404 },
      );
    }

    // Only allow marking as delivered if it's already fulfilled (PENDING, IN_TRANSIT, etc)
    const validStatuses = [
      'PENDING' as any,
      'IN_TRANSIT' as any,
      DispatchStatus.PENDING,
      DispatchStatus.IN_TRANSIT,
    ];
    if (!validStatuses.includes(dispatch.status)) {
      return NextResponse.json(
        { error: 'Only fulfilled dispatches can be marked as delivered' },
        { status: 400 },
      );
    }

    const updatedDispatch = await prisma.$transaction(async (tx) => {
      const completed = await tx.storeDispatch.update({
        where: { id },
        data: {
          status: 'DELIVERED',
          deliveryDate: new Date(),
        },
      });

      if (dispatch.orderId) {
        await tx.order.update({
          where: { id: dispatch.orderId },
          data: { status: 'DELIVERED' },
        });
      }

      return completed;
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Marked Store Dispatch as Delivered',
        module: 'Store',
        details: {
          dispatchId: updatedDispatch.id,
          dispatchNumber: updatedDispatch.dispatchNumber,
        },
      },
    });

    return NextResponse.json(updatedDispatch);
  } catch (error) {
    console.error('Error marking dispatch as delivered:', error);
    return NextResponse.json(
      { error: 'Failed to mark dispatch as delivered' },
      { status: 500 },
    );
  }
}
