// app/api/production/orders/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { computeProgressPercent, computeScheduleStatus, computeShortfall } from '@/lib/production-utils';

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
    // ?view=units → full tracking+rework data (used by the Units tab)
    // default (summary) → lightweight metadata + per-action progress (used by layout + all other tabs)
    const view = new URL(request.url).searchParams.get('view') ?? 'summary';

    // Shared includes across both views
    const sharedInclude = {
      product: {
        select: { id: true, name: true, productNumber: true, category: true, primaryImage: true, description: true },
      },
      manager: { select: { id: true, name: true, email: true } },
      stages: {
        include: {
          responsible: { select: { id: true, name: true, email: true } },
          actionItems: {
            include: { responsible: { select: { id: true, name: true, email: true } } },
            orderBy: { sortOrder: 'asc' as const },
          },
        },
        orderBy: { sortOrder: 'asc' as const },
      },
      materialRequisitions: {
        select: { id: true, status: true, productionUnitId: true },
        orderBy: { createdAt: 'desc' as const },
      },
    };

    let order: any;

    if (view === 'units') {
      // Full unit data: stepTrackings + reworks (rework task attachments included for photo display)
      order = await prisma.productionOrder.findUnique({
        where: { id },
        include: {
          ...sharedInclude,
          units: {
            include: {
              stepTrackings: {
                select: {
                  id: true,
                  actionItemId: true,
                  status: true,
                  startedAt: true,
                  completedAt: true,
                  decisionOutcome: true,
                  rejectionReason: true,
                  _count: { select: { activities: true } },
                },
              },
              reworks: {
                include: {
                  createdBy: { select: { id: true, name: true } },
                  completedBy: { select: { id: true, name: true } },
                  tasks: {
                    select: {
                      id: true, name: true, status: true, notes: true,
                      completedAt: true, sortOrder: true, attachments: true,
                    },
                    orderBy: { sortOrder: 'asc' as const },
                  },
                },
                orderBy: { createdAt: 'desc' as const },
              },
            },
            orderBy: { unitNumber: 'asc' as const },
          },
        },
      });
    } else {
      // Summary: minimal unit list only (no tracking records, no reworks)
      order = await prisma.productionOrder.findUnique({
        where: { id },
        include: {
          ...sharedInclude,
          units: {
            select: { id: true, unitId: true, unitNumber: true, status: true },
            orderBy: { unitNumber: 'asc' as const },
          },
        },
      });
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Production order not found' },
        { status: 404 }
      );
    }

    // ── Progress calculation ──────────────────────────────────────────────────
    let totalActions: number;
    let completedActions: number;
    let stagesWithProgress: any[];

    if (view === 'units') {
      // Compute from loaded data (already in memory)
      totalActions = 0;
      completedActions = 0;
      order.units.forEach((unit: any) => {
        totalActions += unit.stepTrackings.length;
        completedActions += unit.stepTrackings.filter(
          (t: any) => t.status === 'COMPLETED' || t.status === 'SKIPPED',
        ).length;
      });
      stagesWithProgress = order.stages;
    } else {
      // Summary view: use aggregation queries — no tracking records loaded
      const [total, completed, completedByAction] = await Promise.all([
        prisma.unitStepTracking.count({ where: { unit: { productionOrderId: id } } }),
        prisma.unitStepTracking.count({ where: { unit: { productionOrderId: id }, status: { in: ['COMPLETED', 'SKIPPED'] } } }),
        prisma.unitStepTracking.groupBy({
          by: ['actionItemId'],
          where: { unit: { productionOrderId: id }, status: { in: ['COMPLETED', 'SKIPPED'] } },
          _count: { _all: true },
        }),
      ]);
      totalActions = total;
      completedActions = completed;

      const totalUnits = order.units.length;
      const completedByActionMap = new Map(completedByAction.map((c: any) => [c.actionItemId, c._count._all]));

      // Enrich stages and action items with pre-computed progressPercent for the Gantt
      stagesWithProgress = order.stages.map((stage: any) => {
        const actionItemsWithProgress = stage.actionItems.map((action: any) => ({
          ...action,
          progressPercent: totalUnits > 0
            ? Math.round(((completedByActionMap.get(action.id) ?? 0) / totalUnits) * 100)
            : 0,
        }));
        const stageCompleted = actionItemsWithProgress.reduce(
          (sum: number, a: any) => sum + (completedByActionMap.get(a.id) ?? 0), 0,
        );
        const stageTotal = actionItemsWithProgress.length * totalUnits;
        return {
          ...stage,
          actionItems: actionItemsWithProgress,
          progressPercent: stageTotal > 0 ? Math.round((stageCompleted / stageTotal) * 100) : 0,
        };
      });
    }

    const progressPercent = computeProgressPercent(completedActions, totalActions);
    const scheduleStatus = computeScheduleStatus(order, progressPercent);
    const shortfallQuantity = computeShortfall(order.quantityPackaged, order.quantity);

    return NextResponse.json({
      ...order,
      stages: stagesWithProgress,
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
