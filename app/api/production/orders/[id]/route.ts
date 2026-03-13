// app/api/production/orders/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            productNumber: true,
            category: true,
            primaryImage: true,
            description: true,
          },
        },
        manager: {
          select: { id: true, name: true, email: true },
        },
        stages: {
          include: {
            responsible: {
              select: { id: true, name: true, email: true },
            },
            actionItems: {
              include: {
                responsible: {
                  select: { id: true, name: true, email: true },
                },
                _count: {
                  select: { activities: true },
                },
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        // Top-up run linkage
        parentOrder: {
          select: { id: true, orderNumber: true, status: true, quantity: true },
        },
        topUpRuns: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            quantity: true,
            quantityPackaged: true,
            scheduledStart: true,
            scheduledEnd: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Production order not found' },
        { status: 404 }
      );
    }

    // Calculate progress
    const totalActions = order.stages.reduce(
      (acc, stage) => acc + stage.actionItems.length,
      0
    );
    const completedActions = order.stages.reduce(
      (acc, stage) =>
        acc +
        stage.actionItems.filter(
          (a) => a.status === 'COMPLETED' || a.status === 'SKIPPED'
        ).length,
      0
    );
    const progressPercent =
      totalActions > 0
        ? Math.round((completedActions / totalActions) * 100)
        : 0;

    // Determine schedule status
    const now = new Date();
    let scheduleStatus = 'ON_TRACK';
    if (order.status === 'COMPLETED' || order.status === 'PARTIALLY_COMPLETED') {
      if (order.actualEnd && order.actualEnd <= order.scheduledEnd) {
        scheduleStatus = 'AHEAD';
      } else if (order.actualEnd && order.actualEnd > order.scheduledEnd) {
        scheduleStatus = 'DELAYED';
      }
    } else if (order.status === 'IN_PROGRESS') {
      if (now > order.scheduledEnd) {
        scheduleStatus = 'DELAYED';
      } else {
        const totalDuration =
          order.scheduledEnd.getTime() - order.scheduledStart.getTime();
        const elapsed = now.getTime() - order.scheduledStart.getTime();
        const expectedProgress =
          totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
        if (progressPercent > expectedProgress + 10) {
          scheduleStatus = 'AHEAD';
        } else if (progressPercent < expectedProgress - 15) {
          scheduleStatus = 'DELAYED';
        }
      }
    }

    // Compute shortfall for convenience
    const shortfallQuantity =
      order.quantityPackaged !== null && order.quantityPackaged < order.quantity
        ? order.quantity - order.quantityPackaged
        : 0;

    return NextResponse.json({
      ...order,
      progressPercent,
      totalActions,
      completedActions,
      scheduleStatus,
      shortfallQuantity,
    });
  } catch (error) {
    console.error('Error fetching production order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production order' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !['ADMIN', 'PRODUCTION_MANAGER', 'OPERATION_MANAGER'].includes(
        session.user.role
      )
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      status,
      priority,
      notes,
      scheduledStart,
      scheduledEnd,
      quantityStarted,
      quantityPassed,
      quantityRejected,
      quantityReworked,
      quantityPackaged,
      yieldRate,
    } = body;

    const existingOrder = await prisma.productionOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Production order not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // ── Status transition with shortfall detection ────────────────────────
    if (status) {
      if (status === 'COMPLETED') {
        // Resolve the final packaged qty: prefer value from this request,
        // else fall back to what is already stored on the order.
        const finalPackaged =
          quantityPackaged !== undefined
            ? quantityPackaged
            : existingOrder.quantityPackaged;

        if (finalPackaged !== null && finalPackaged < existingOrder.quantity) {
          // Shortfall detected — close as PARTIALLY_COMPLETED instead
          updateData.status = 'PARTIALLY_COMPLETED';
        } else {
          updateData.status = 'COMPLETED';
        }
        updateData.actualEnd = new Date();
      } else if (status === 'IN_PROGRESS' && !existingOrder.actualStart) {
        updateData.status = 'IN_PROGRESS';
        updateData.actualStart = new Date();
      } else {
        updateData.status = status;
      }
    }

    if (priority) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;
    if (scheduledStart) updateData.scheduledStart = new Date(scheduledStart);
    if (scheduledEnd) updateData.scheduledEnd = new Date(scheduledEnd);

    // Quantity / yield fields
    if (quantityStarted !== undefined) updateData.quantityStarted = quantityStarted;
    if (quantityPassed !== undefined) updateData.quantityPassed = quantityPassed;
    if (quantityRejected !== undefined) updateData.quantityRejected = quantityRejected;
    if (quantityReworked !== undefined) updateData.quantityReworked = quantityReworked;
    if (quantityPackaged !== undefined) updateData.quantityPackaged = quantityPackaged;
    if (yieldRate !== undefined) updateData.yieldRate = yieldRate;

    const updatedOrder = await prisma.productionOrder.update({
      where: { id },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            productNumber: true,
            category: true,
          },
        },
        manager: {
          select: { id: true, name: true, email: true },
        },
        topUpRuns: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            quantity: true,
            quantityPackaged: true,
          },
        },
      },
    });

    // ── Update linked ProductionRequests ──────────────────────────────────
    if (updateData.status === 'IN_PROGRESS') {
      await prisma.productionRequest.updateMany({
        where: { productionOrderId: id },
        data: { status: 'SCHEDULED' },
      });
    } else if (updateData.status === 'COMPLETED') {
      // Fully satisfied — complete all linked requests
      await prisma.productionRequest.updateMany({
        where: { productionOrderId: id },
        data: {
          status: 'COMPLETED',
          dateCompleted: new Date(),
        },
      });
    }
    // PARTIALLY_COMPLETED keeps requests as SCHEDULED until top-up completes

    // ── If this is a top-up run completing, check if parent is now fully covered ──
    if (updateData.status === 'COMPLETED' && existingOrder.isTopUpRun && existingOrder.parentOrderId) {
      const parentOrder = await prisma.productionOrder.findUnique({
        where: { id: existingOrder.parentOrderId },
        include: {
          topUpRuns: {
            select: { quantityPackaged: true, status: true },
          },
        },
      });

      if (parentOrder && parentOrder.status === 'PARTIALLY_COMPLETED') {
        // Sum all produced: parent packaged + all top-up runs' packaged qty
        const parentProduced = parentOrder.quantityPackaged ?? 0;
        const topUpProduced = parentOrder.topUpRuns.reduce(
          (acc, run) => acc + (run.quantityPackaged ?? 0),
          0
        );
        const totalProduced = parentProduced + topUpProduced;

        if (totalProduced >= parentOrder.quantity) {
          // Shortfall fully covered — mark parent as COMPLETED
          await prisma.productionOrder.update({
            where: { id: existingOrder.parentOrderId },
            data: { status: 'COMPLETED', actualEnd: new Date() },
          });

          // Complete linked production requests for the parent
          await prisma.productionRequest.updateMany({
            where: { productionOrderId: existingOrder.parentOrderId },
            data: { status: 'COMPLETED', dateCompleted: new Date() },
          });

          // Log the auto-completion
          await prisma.activityLog.create({
            data: {
              userId: session.user.id,
              action: 'Auto-Completed Parent Order (Shortfall Covered by Top-Up Runs)',
              module: 'Production',
              details: {
                parentOrderId: existingOrder.parentOrderId,
                parentOrderNumber: parentOrder.orderNumber,
                totalProduced,
                plannedQuantity: parentOrder.quantity,
                triggeredByTopUpOrderId: id,
                triggeredByTopUpOrderNumber: existingOrder.orderNumber,
              },
            },
          });
        }
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `Updated Production Order${updateData.status ? ` - Status: ${updateData.status}` : ''}`,
        module: 'Production',
        details: {
          orderId: id,
          orderNumber: updatedOrder.orderNumber,
          changes: body,
          resolvedStatus: updateData.status,
        },
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating production order:', error);
    return NextResponse.json(
      { error: 'Failed to update production order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.permissions?.includes('production_orders:delete')) {
      return NextResponse.json(
        { error: 'You do not have permission to delete production orders.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const order = await prisma.productionOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Production order not found' },
        { status: 404 }
      );
    }

    if (order.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only DRAFT orders can be deleted' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Detach associated ProductionRequests
      await tx.productionRequest.updateMany({
        where: { productionOrderId: id },
        data: {
          status: 'PENDING',
          dateCompleted: null,
          productionOrderId: null,
        },
      });

      const stages = await tx.productionStageEntry.findMany({
        where: { productionOrderId: id },
        select: { id: true },
      });
      const stageIds = stages.map((s) => s.id);

      await tx.productionActionItem.deleteMany({
        where: { stageEntryId: { in: stageIds } },
      });

      await tx.productionStageEntry.deleteMany({
        where: { productionOrderId: id },
      });

      await tx.productionOrder.delete({
        where: { id },
      });
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Deleted Production Order',
        module: 'Production',
        details: { orderNumber: order.orderNumber },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting production order:', error);
    return NextResponse.json(
      { error: 'Failed to delete production order' },
      { status: 500 }
    );
  }
}
