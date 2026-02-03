// src/app/api/orders/[id]/create-production-units/route.ts
// This endpoint creates production units with serial numbers when order is confirmed

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateUniqueSerialNumbers } from '@/lib/serialNumber';

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

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        units: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if units already exist
    if (order.units.length > 0) {
      return NextResponse.json(
        {
          error: 'Production units already created',
          existingUnits: order.units.length,
        },
        { status: 400 },
      );
    }

    console.log(
      `Generating ${order.quantity} serial numbers for order ${order.orderNumber}...`,
    );

    // Generate unique serial numbers
    const serialNumbers = await generateUniqueSerialNumbers(
      order.quantity,
      prisma,
    );

    console.log('Generated serial numbers:', serialNumbers);

    // Create production units in transaction
    const productionUnits = await prisma.$transaction(
      serialNumbers.map((serialNumber, index) =>
        prisma.productionUnit.create({
          data: {
            unitId: '',
            orderId: order.id,
            unitNumber: index + 1,
            serialNumber: serialNumber,
            qrCode: serialNumber, // Can be enhanced with more data
            currentStage: 'SMD_PRODUCTION',
            status: 'IN_PROGRESS',
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
        action: 'Created Production Units',
        module: 'Production',
        details: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          quantity: order.quantity,
          unitsCreated: productionUnits.length,
          serialNumbers: serialNumbers,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully created ${productionUnits.length} production units`,
      units: productionUnits.map((unit) => ({
        id: unit.id,
        unitNumber: unit.unitNumber,
        serialNumber: unit.serialNumber,
        status: unit.status,
        currentStage: unit.currentStage,
      })),
    });
  } catch (error: any) {
    console.error('Error creating production units:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create production units' },
      { status: 500 },
    );
  }
}

// Get production units for an order
export async function GET(
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

    const units = await prisma.productionUnit.findMany({
      where: { orderId },
      orderBy: { unitNumber: 'asc' },
      include: {
        productionLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        qcTests: {
          orderBy: { testedAt: 'desc' },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      units,
      total: units.length,
    });
  } catch (error) {
    console.error('Error fetching production units:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production units' },
      { status: 500 },
    );
  }
}
