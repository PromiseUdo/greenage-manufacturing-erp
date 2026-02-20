// src/app/api/orders/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const params = await context.params;
  const { id } = params;

  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        lineItems: {
          include: {
            storeItem: {
              select: {
                id: true,
                name: true,
                itemNumber: true,
                category: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                productNumber: true,
                productCode: true,
                category: true,
                specifications: true,
              },
            },
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            finalAmount: true,
            paidAmount: true,
            balanceAmount: true,
          },
          take: 1,
        },
        units: {
          orderBy: { unitNumber: 'asc' },
          select: {
            id: true,
            unitNumber: true,
            unitId: true,
            serialNumber: true,
            currentStage: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Map invoices array to single invoice object for frontend compatibility
    const formattedOrder = {
      ...order,
      invoice: order.invoices?.[0] || null,
      invoices: undefined,
    };

    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const params = await context.params;
  const { id } = params;

  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, priority, deliveryDate } = body;

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(deliveryDate && { deliveryDate }),
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 },
    );
  }
}
