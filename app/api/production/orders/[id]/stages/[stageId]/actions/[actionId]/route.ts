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
      quantityAffected,
      rejectionReason,
      rejectionCategory,
      quantityPackaged
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

    const updateData: any = {};

    if (status) {
      updateData.status = status;

      if (status === 'IN_PROGRESS' && !actionItem.startedAt) {
        updateData.startedAt = new Date();
      }
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
        updateData.completedById = session.user.id;
        if (!actionItem.startedAt) {
          updateData.startedAt = new Date();
        }
      }
    }

    if (responsibleId !== undefined) {
      updateData.responsibleId = responsibleId || null;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (decisionOutcome !== undefined) {
      updateData.decisionOutcome = decisionOutcome;
    }
    if (quantityAffected !== undefined) {
      updateData.quantityAffected = quantityAffected;
    }
    if (rejectionReason !== undefined) {
      updateData.rejectionReason = rejectionReason;
    }
    if (rejectionCategory !== undefined) {
      updateData.rejectionCategory = rejectionCategory;
    }

    const updatedAction = await prisma.productionActionItem.update({
      where: { id: actionId },
      data: updateData,
      include: {
        responsible: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { activities: true },
        },
      },
    });

    // Check if ALL action items in this stage are completed/skipped → auto-complete stage
    if (status === 'COMPLETED' || status === 'SKIPPED') {
      const allActions = await prisma.productionActionItem.findMany({
        where: { stageEntryId: stageId },
        select: { status: true },
      });

      const allDone = allActions.every(
        (a) => a.status === 'COMPLETED' || a.status === 'SKIPPED'
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

    // Also auto-set stage to IN_PROGRESS if it's NOT_STARTED and action starts
    if (status === 'IN_PROGRESS' || status === 'COMPLETED') {
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

        // Update linked ProductionRequests based on order status change
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
