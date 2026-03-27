// app/api/production/orders/[id]/stages/[stageId]/actions/[actionId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; stageId: string; actionId: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, stageId, actionId } = await params;
    const body = await request.json();
    const {
      status,
      responsibleId,
      notes,
      decisionOutcome,
      rejectionReason,
      rejectionCategory,
    } = body;

    // Verify production order exists
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      select: { id: true, status: true, orderNumber: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Production order not found' },
        { status: 404 }
      );
    }

    // Verify action item exists and belongs to this stage/order
    const actionItem = await prisma.productionActionItem.findFirst({
      where: {
        id: actionId,
        stageEntryId: stageId,
        stageEntry: { productionOrderId: id },
      },
    });

    if (!actionItem) {
      return NextResponse.json(
        { error: 'Action item not found' },
        { status: 404 }
      );
    }

    // responsibleId lives on the blueprint; update it directly
    if (responsibleId !== undefined) {
      await prisma.productionActionItem.update({
        where: { id: actionId },
        data: { responsibleId: responsibleId || null },
      });
    }

    // status and tracking fields live on UnitStepTracking
    if (status) {
      const trackingData: any = { status };
      if (status === 'COMPLETED') {
        trackingData.completedAt = new Date();
        trackingData.completedById = session.user.id;
      }
      if (notes !== undefined) trackingData.notes = notes;
      if (decisionOutcome !== undefined) trackingData.decisionOutcome = decisionOutcome;
      if (rejectionReason !== undefined) trackingData.rejectionReason = rejectionReason;
      if (rejectionCategory !== undefined) trackingData.rejectionCategory = rejectionCategory;

      await prisma.unitStepTracking.updateMany({
        where: {
          actionItemId: actionId,
          status: { notIn: ['COMPLETED', 'SKIPPED'] },
        },
        data: trackingData,
      });
    }

    const updatedAction = await prisma.productionActionItem.findUniqueOrThrow({
      where: { id: actionId },
      include: {
        responsible: {
          select: { id: true, name: true, email: true },
        },
        unitTrackings: {
          select: { status: true },
        },
      },
    });

    // Check if ALL unit trackings in this stage are completed/skipped → auto-complete stage
    if (status === 'COMPLETED' || status === 'SKIPPED') {
      const allTrackings = await prisma.unitStepTracking.findMany({
        where: { actionItem: { stageEntryId: stageId } },
        select: { status: true },
      });

      const allDone =
        allTrackings.length > 0 &&
        allTrackings.every(
          (t) => t.status === 'COMPLETED' || t.status === 'SKIPPED'
        );

      if (allDone) {
        await prisma.productionStageEntry.update({
          where: { id: stageId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            completedById: session.user.id,
            actualEnd: new Date(),
          },
        });

        // Check if ALL stages are now complete → auto-complete order
        const allStages = await prisma.productionStageEntry.findMany({
          where: { productionOrderId: id },
          select: { status: true },
        });

        const allStagesComplete = allStages.every(
          (s) => s.status === 'COMPLETED'
        );

        if (allStagesComplete) {
          const updatedOrder = await prisma.productionOrder.update({
            where: { id },
            data: {
              status: 'COMPLETED',
              actualEnd: new Date(),
            },
          });

          // Auto-complete requests if packaged quantity meets the desired order quantity
          const orderQuantity = updatedOrder.quantity;
          const packaged = updatedOrder.quantityPackaged || 0;

          if (packaged >= orderQuantity) {
            await prisma.productionRequest.updateMany({
              where: { productionOrderId: id },
              data: {
                status: 'COMPLETED',
                dateCompleted: new Date(),
              },
            });
          }
        }
      }
    }

    // Auto-set stage to IN_PROGRESS if it's NOT_STARTED
    if (status === 'COMPLETED') {
      const stage = await prisma.productionStageEntry.findUnique({
        where: { id: stageId },
        select: { status: true, actualStart: true },
      });

      if (stage && stage.status === 'NOT_STARTED') {
        await prisma.productionStageEntry.update({
          where: { id: stageId },
          data: {
            status: 'IN_PROGRESS',
            actualStart: stage.actualStart || new Date(),
          },
        });
      }

      // Also ensure order is IN_PROGRESS
      if (order.status === 'DRAFT') {
        await prisma.productionOrder.update({
          where: { id },
          data: {
            status: 'IN_PROGRESS',
            actualStart: new Date(),
          },
        });

        await prisma.productionRequest.updateMany({
          where: { productionOrderId: id },
          data: { status: 'SCHEDULED' },
        });
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `${status === 'COMPLETED' ? 'Completed' : 'Updated'} Action: ${updatedAction.actionName}`,
        module: 'Production',
        details: {
          orderId: id,
          orderNumber: order.orderNumber,
          stageId,
          actionId,
          stepId: updatedAction.stepId,
          changes: body,
        },
      },
    });

    return NextResponse.json(updatedAction);
  } catch (error) {
    console.error('Error updating action item:', error);
    return NextResponse.json(
      { error: 'Failed to update action item' },
      { status: 500 }
    );
  }
}
