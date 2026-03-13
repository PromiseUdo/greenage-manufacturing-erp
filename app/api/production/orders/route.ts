// app/api/production/orders/route.ts

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
                select: {
                  id: true,
                  status: true,
                },
              },
            },
            orderBy: { sortOrder: 'asc' },
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
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.productionOrder.count({ where }),
    ]);

    // Calculate progress for each order
    const ordersWithProgress = orders.map((order) => {
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
        totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

      // Determine schedule status
      const now = new Date();
      let scheduleStatus = 'ON_TRACK';
      if (order.status === 'COMPLETED') {
        if (order.actualEnd && order.actualEnd <= order.scheduledEnd) {
          scheduleStatus = 'AHEAD';
        } else if (order.actualEnd && order.actualEnd > order.scheduledEnd) {
          scheduleStatus = 'DELAYED';
        }
      } else if (order.status === 'IN_PROGRESS') {
        if (now > order.scheduledEnd) {
          scheduleStatus = 'DELAYED';
        } else {
          // Check if progress is proportional to time elapsed
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

      const shortfallQuantity =
        order.quantityPackaged !== null && order.quantityPackaged < order.quantity
          ? order.quantity - order.quantityPackaged
          : 0;

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
      { status: 500 }
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
      !['ADMIN', 'PRODUCTION_MANAGER', 'OPERATION_MANAGER'].includes(
        session.user.role
      )
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    if (!productId || !quantity || !scheduledStart || !scheduledEnd || !stages?.length) {
      return NextResponse.json(
        {
          error:
            'Product, quantity, scheduled dates, and at least one stage are required',
        },
        { status: 400 }
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

    // Create production order with stages and action items in a transaction
    // Increase timeout because creating many action items can be slow on MongoDB
    const productionOrder = await prisma.$transaction(async (tx) => {
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

      // Create stages and their action items
      for (const stage of stages) {
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

        // Create action items for this stage
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
                responsibleId: action.responsibleId || null,
                status: 'PENDING',
                scheduledStart: action.scheduledStart ? new Date(action.scheduledStart) : null,
                scheduledEnd: action.scheduledEnd ? new Date(action.scheduledEnd) : null,
              },
            });
          }
        }
      }

      // Link and acknowledge production requests
      if (productionRequestIds && Array.isArray(productionRequestIds) && productionRequestIds.length > 0) {
        await tx.productionRequest.updateMany({
          where: { id: { in: productionRequestIds } },
          data: {
            productionOrderId: order.id,
            status: 'ACKNOWLEDGED',
          },
        });
      }

      // Return the created order with all relations
      return tx.productionOrder.findUnique({
        where: { id: order.id },
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
          stages: {
            include: {
              responsible: {
                select: { id: true, name: true },
              },
              actionItems: {
                include: {
                  responsible: {
                    select: { id: true, name: true },
                  },
                },
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    }, { timeout: 30000 });

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
      { status: 500 }
    );
  }
}
