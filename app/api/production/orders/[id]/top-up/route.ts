// app/api/production/orders/[id]/top-up/route.ts
// POST — create a top-up (child) production order to cover a shortfall

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { PRODUCTION_STAGES } from '@/lib/production-stages';

export async function POST(
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

    const { id: parentId } = await params;

    // ── Validate parent order ─────────────────────────────────────────────
    const parentOrder = await prisma.productionOrder.findUnique({
      where: { id: parentId },
      include: {
        topUpRuns: { select: { quantity: true, quantityPackaged: true, status: true } },
      },
    });

    if (!parentOrder) {
      return NextResponse.json(
        { error: 'Parent production order not found' },
        { status: 404 }
      );
    }

    if (parentOrder.status !== 'PARTIALLY_COMPLETED') {
      return NextResponse.json(
        {
          error:
            'Top-up runs can only be created for PARTIALLY_COMPLETED orders. ' +
            `This order is currently ${parentOrder.status}.`,
        },
        { status: 400 }
      );
    }

    // ── Calculate shortfall ───────────────────────────────────────────────
    // Total produced across parent + all previous top-up runs
    const parentProduced = parentOrder.quantityPackaged ?? 0;
    const topUpProduced = parentOrder.topUpRuns.reduce((acc, r) => {
      return acc + (r.quantityPackaged ?? 0);
    }, 0);
    const totalProduced = parentProduced + topUpProduced;
    const remainingShortfall = parentOrder.quantity - totalProduced;

    if (remainingShortfall <= 0) {
      return NextResponse.json(
        { error: 'No shortfall remaining — the planned quantity has already been met.' },
        { status: 400 }
      );
    }

    // ── Parse request body ────────────────────────────────────────────────
    const body = await request.json();
    const { quantity, scheduledStart, scheduledEnd, priority, notes, stages } = body;

    if (!scheduledStart || !scheduledEnd) {
      return NextResponse.json(
        { error: 'scheduledStart and scheduledEnd are required' },
        { status: 400 }
      );
    }

    // quantity defaults to remaining shortfall but manager can override (but not exceed it)
    const topUpQuantity = quantity
      ? Math.min(parseInt(quantity), remainingShortfall)
      : remainingShortfall;

    // ── Generate order number ─────────────────────────────────────────────
    const lastOrder = await prisma.productionOrder.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true },
    });

    const year = new Date().getFullYear();
    let orderCount = 1;
    if (lastOrder) {
      const parts = lastOrder.orderNumber.split('-');
      const lastYear = parseInt(parts[1]);
      const lastNum = parseInt(parts[2]);
      if (lastYear === year) {
        orderCount = lastNum + 1;
      }
    }
    const orderNumber = `PRD-${year}-${orderCount.toString().padStart(4, '0')}`;

    // ── Use provided stages or fall back to default PRODUCTION_STAGES ─────
    const stagesToCreate = stages && stages.length > 0 ? stages : PRODUCTION_STAGES;

    // ── Create top-up order in a transaction ──────────────────────────────
    const topUpOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.productionOrder.create({
        data: {
          orderNumber,
          productId: parentOrder.productId,
          quantity: topUpQuantity,
          scheduledStart: new Date(scheduledStart),
          scheduledEnd: new Date(scheduledEnd),
          priority: priority || parentOrder.priority,
          notes: notes || `Top-up run for ${parentOrder.orderNumber} — producing ${topUpQuantity} of ${remainingShortfall} remaining units.`,
          managerId: session.user.id,
          status: 'DRAFT',
          isTopUpRun: true,
          parentOrderId: parentId,
        },
      });

      // Create stages and their action items
      for (const stage of stagesToCreate) {
        const stageEntry = await tx.productionStageEntry.create({
          data: {
            productionOrderId: order.id,
            stageName: stage.stageName,
            stageLabel: stage.stageLabel,
            sortOrder: stage.sortOrder,
            scheduledStart: (stage as any).scheduledStart
              ? new Date((stage as any).scheduledStart)
              : null,
            scheduledEnd: (stage as any).scheduledEnd
              ? new Date((stage as any).scheduledEnd)
              : null,
            responsibleId: (stage as any).responsibleId || null,
            status: 'NOT_STARTED',
          },
        });

        if (stage.actionItems?.length) {
          for (const action of stage.actionItems) {
            await tx.productionActionItem.create({
              data: {
                stageEntryId: stageEntry.id,
                stepId: action.stepId,
                actionName: action.actionName,
                defaultResponsibility: action.defaultResponsibility,
                outputNextStep: action.outputNextStep,
                focusGoal: action.focusGoal || null,
                sortOrder: action.sortOrder,
                responsibleId: (action as any).responsibleId || null,
                status: 'PENDING',
                scheduledStart: (action as any).scheduledStart
                  ? new Date((action as any).scheduledStart)
                  : null,
                scheduledEnd: (action as any).scheduledEnd
                  ? new Date((action as any).scheduledEnd)
                  : null,
              },
            });
          }
        }
      }

      return tx.productionOrder.findUnique({
        where: { id: order.id },
        include: {
          product: { select: { id: true, name: true, productNumber: true, category: true } },
          manager: { select: { id: true, name: true, email: true } },
          stages: {
            include: {
              actionItems: { orderBy: { sortOrder: 'asc' } },
            },
            orderBy: { sortOrder: 'asc' },
          },
          parentOrder: { select: { id: true, orderNumber: true } },
        },
      });
    }, { timeout: 30000 });

    // ── Activity log ──────────────────────────────────────────────────────
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Created Top-Up Production Run',
        module: 'Production',
        details: {
          topUpOrderId: topUpOrder?.id,
          topUpOrderNumber: orderNumber,
          parentOrderId: parentId,
          parentOrderNumber: parentOrder.orderNumber,
          topUpQuantity,
          remainingShortfall,
        },
      },
    });

    return NextResponse.json(topUpOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating top-up production order:', error);
    return NextResponse.json(
      { error: 'Failed to create top-up production order' },
      { status: 500 }
    );
  }
}
