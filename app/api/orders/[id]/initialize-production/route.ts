// src/app/api/orders/[id]/initialize-production/route.ts
// This creates ProductionUnit records when production is ready to start

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const params = await context.params;
  const { id: orderId } = params;

  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get order with generated unit IDs
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: {
          select: {
            name: true,
            productCode: true,
          },
        },
        units: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if production units already created
    if (order.units && order.units.length > 0) {
      return NextResponse.json(
        {
          error: 'Production units already initialized',
          unitsCount: order.units.length,
        },
        { status: 400 },
      );
    }

    // Check if unit IDs were generated
    if (!order.generatedUnitIds || !Array.isArray(order.generatedUnitIds)) {
      return NextResponse.json(
        { error: 'No unit IDs found for this order. Please regenerate.' },
        { status: 400 },
      );
    }

    const unitIds = order.generatedUnitIds as string[];

    if (unitIds.length !== order.quantity) {
      return NextResponse.json(
        {
          error: `Mismatch: ${unitIds.length} unit IDs but order quantity is ${order.quantity}`,
        },
        { status: 400 },
      );
    }

    // ✅ CREATE PRODUCTION UNITS WITH PRE-GENERATED IDs
    const productionUnits = await prisma.$transaction(
      unitIds.map((unitId, index) =>
        prisma.productionUnit.create({
          data: {
            orderId: order.id,
            unitNumber: index + 1,
            unitId: unitId, // ✅ Use pre-generated unit ID
            qrCode: unitId, // Can be enhanced with more data
            status: 'IN_PROGRESS',
            currentStage: 'SMD_PRODUCTION',
          },
        }),
      ),
    );

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'IN_PRODUCTION',
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Initialized Production',
        module: 'Production',
        details: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          unitsCreated: productionUnits.length,
          unitIds: unitIds,
        },
      },
    });

    return NextResponse.json({
      message: `Successfully initialized ${productionUnits.length} production units`,
      units: productionUnits,
      unitIds: unitIds,
    });
  } catch (error: any) {
    console.error('Error initializing production:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize production units' },
      { status: 500 },
    );
  }
}
