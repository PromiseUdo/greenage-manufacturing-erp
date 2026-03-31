// app/api/production/orders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import {
  computeProgressPercent,
  computeScheduleStatus,
  computeShortfall,
} from '@/lib/production-utils';

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
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { manager: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    const [orders, total] = await Promise.all([
      prisma.productionOrder.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              productNumber: true,
              category: true,
              primaryImage: true,
            },
          },
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          stages: {
            include: {
              actionItems: {
                select: { id: true },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          // Only fetch unit IDs + total tracking count — no individual tracking records
          units: {
            select: {
              id: true,
              status: true,
              _count: { select: { stepTrackings: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.productionOrder.count({ where }),
    ]);

    // Fetch completed tracking counts for all units in one aggregation query
    const unitIds = orders.flatMap((o) => o.units.map((u) => u.id));
    const completedCounts =
      unitIds.length > 0
        ? await prisma.unitStepTracking.groupBy({
            by: ['unitId'],
            where: {
              unitId: { in: unitIds },
              status: { in: ['COMPLETED', 'SKIPPED'] },
            },
            _count: { _all: true },
          })
        : [];
    const completedByUnit = new Map(
      completedCounts.map((c) => [c.unitId, c._count._all]),
    );

    // Calculate progress for each order
    const ordersWithProgress = orders.map((order) => {
      let totalActions = 0;
      let completedActions = 0;

      order.units.forEach((unit) => {
        totalActions += unit._count.stepTrackings;
        completedActions += completedByUnit.get(unit.id) ?? 0;
      });

      const progressPercent = computeProgressPercent(
        completedActions,
        totalActions,
      );
      const scheduleStatus = computeScheduleStatus(order, progressPercent);
      const shortfallQuantity = computeShortfall(
        order.quantityPackaged,
        order.quantity,
      );

      return {
        ...order,
        progressPercent,
        totalActions,
        completedActions,
        scheduleStatus,
        shortfallQuantity,
        stageCount: order.stages.length,
      };
    });

    return NextResponse.json({
      orders: ordersWithProgress,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching production orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production orders' },
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

    // if (
    //   !['ADMIN', 'PRODUCTION_MANAGER', 'OPERATION_MANAGER'].includes(
    //     session.user.role
    //   )
    // ) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    if (!session.user.permissions?.includes('production_orders:create')) {
      return NextResponse.json(
        { error: 'You do not have permission to create production orders.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      productId,
      quantity,
      scheduledStart,
      scheduledEnd,
      priority,
      notes,
      stages,
      productionRequestIds,
    } = body;

    // Validate required fields
    if (
      !productId ||
      !quantity ||
      !scheduledStart ||
      !scheduledEnd ||
      !stages?.length
    ) {
      return NextResponse.json(
        {
          error:
            'Product, quantity, scheduled dates, and at least one stage are required',
        },
        { status: 400 },
      );
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 400 });
    }

    // Generate order number
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

    // Create production order with stages and action items in a transaction.
    // Stages are created in parallel, and action items within each stage are
    // created in parallel to minimise round-trips on MongoDB Atlas.
    // The final findUnique is intentionally outside the transaction so it does
    // not count against the transaction timeout.
    const orderId = await prisma.$transaction(
      async (tx) => {
        // 1. Reserve sequential unit numbers on the product atomically
        const updatedProduct = await tx.product.update({
          where: { id: productId },
          data: { lastUnitNumber: { increment: quantity } },
        });
        const startUnitNumber = updatedProduct.lastUnitNumber - quantity;

        // 2. Create the order record
        const order = await tx.productionOrder.create({
          data: {
            orderNumber,
            productId,
            quantity,
            scheduledStart: new Date(scheduledStart),
            scheduledEnd: new Date(scheduledEnd),
            priority: priority || 'NORMAL',
            notes: notes || null,
            managerId: session.user.id,
            status: 'DRAFT',
          },
        });

        // 3. Create all stages and their action items in parallel
        const actionItemIdArrays = await Promise.all(
          stages.map(async (stage: any) => {
            const stageEntry = await tx.productionStageEntry.create({
              data: {
                productionOrderId: order.id,
                stageName: stage.stageName,
                stageLabel: stage.stageLabel,
                sortOrder: stage.sortOrder,
                scheduledStart: stage.scheduledStart
                  ? new Date(stage.scheduledStart)
                  : null,
                scheduledEnd: stage.scheduledEnd
                  ? new Date(stage.scheduledEnd)
                  : null,
                responsibleId: stage.responsibleId || null,
                status: 'NOT_STARTED',
              },
            });

            if (!stage.actionItems?.length) return [];

            const createdActions = await Promise.all(
              stage.actionItems.map((action: any) =>
                tx.productionActionItem.create({
                  data: {
                    stageEntryId: stageEntry.id,
                    stepId: action.stepId,
                    actionName: action.actionName,
                    defaultResponsibility: action.defaultResponsibility,
                    outputNextStep: action.outputNextStep,
                    focusGoal: action.focusGoal || null,
                    sortOrder: action.sortOrder,
                    isDecisionPoint: action.isDecisionPoint || false,
                    responsibleId: action.responsibleId || null,
                    scheduledStart: action.scheduledStart
                      ? new Date(action.scheduledStart)
                      : null,
                    scheduledEnd: action.scheduledEnd
                      ? new Date(action.scheduledEnd)
                      : null,
                  },
                }),
              ),
            );
            return createdActions.map((a) => a.id);
          }),
        );
        const actionItemIds = actionItemIdArrays.flat();

        // 4. Create all units in one bulk write
        const unitData = Array.from({ length: quantity }, (_, i) => ({
          productionOrderId: order.id,
          unitNumber: i + 1,
          unitId: `${updatedProduct.productCode}${(startUnitNumber + i + 1).toString().padStart(5, '0')}`,
          currentStage: 'SMD_PRODUCTION' as const,
          status: 'IN_PROGRESS' as const,
        }));
        await tx.productionUnit.createMany({ data: unitData });

        // 5. Fetch created unit IDs
        const createdUnits = await tx.productionUnit.findMany({
          where: { productionOrderId: order.id },
          select: { id: true },
        });

        // 6. Create all step-tracking records in one bulk write
        const trackingData: any[] = [];
        for (const cu of createdUnits) {
          for (const aiId of actionItemIds) {
            trackingData.push({
              unitId: cu.id,
              actionItemId: aiId,
              status: 'PENDING',
            });
          }
        }
        if (trackingData.length > 0) {
          await tx.unitStepTracking.createMany({ data: trackingData });
        }

        // 7. Link and acknowledge production requests
        if (productionRequestIds?.length) {
          await tx.productionRequest.updateMany({
            where: { id: { in: productionRequestIds } },
            data: { productionOrderId: order.id, status: 'ACKNOWLEDGED' },
          });
        }

        return order.id;
      },
      { timeout: 60000 },
    );

    // Fetch the full order outside the transaction (no timeout pressure)
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        product: {
          select: { id: true, name: true, productNumber: true, category: true },
        },
        manager: { select: { id: true, name: true, email: true } },
        stages: {
          include: {
            responsible: { select: { id: true, name: true } },
            actionItems: {
              include: { responsible: { select: { id: true, name: true } } },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        units: { select: { id: true, unitId: true, unitNumber: true } },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Created Production Order',
        module: 'Production',
        details: {
          orderId: productionOrder?.id,
          orderNumber,
          productName: product.name,
          quantity,
        },
      },
    });

    return NextResponse.json(productionOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating production order:', error);
    return NextResponse.json(
      { error: 'Failed to create production order' },
      { status: 500 },
    );
  }
}
