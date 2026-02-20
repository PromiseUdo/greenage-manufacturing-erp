// src/app/api/orders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateUnitIds } from '@/lib/unitIdGenerator';

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

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
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
                },
              },
            },
          },
          invoices: {
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
            },
            take: 1,
          },
          _count: {
            select: {
              units: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    // Map invoices array to single invoice object for frontend compatibility
    const formattedOrders = orders.map((order) => ({
      ...order,
      invoice: order.invoices?.[0] || null,
      invoices: undefined,
    }));

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 },
    );
  }
}

// Create order with line items
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerId,
      lineItems,
      deliveryDate,
      paymentTerms,
      priority,
    } = body;

    // Validation
    if (!customerId || !lineItems?.length || !deliveryDate) {
      return NextResponse.json(
        { error: 'Customer, line items, and delivery date are required' },
        { status: 400 },
      );
    }

    // Compute total quantity for unit ID generation
    const totalQuantity = lineItems.reduce((sum: number, li: any) => sum + li.quantity, 0);

    // Check if any line items need production (have productId but no storeItemId)
    const productItems = lineItems.filter((li: any) => li.productId && !li.storeItemId);
    const allStoreItems = lineItems.every((li: any) => li.storeItemId);

    // Generate unit IDs for product items
    let unitIds: string[] = [];
    if (productItems.length > 0 && productItems[0].productId) {
      const productQty = productItems.reduce((sum: number, li: any) => sum + li.quantity, 0);
      unitIds = await generateUnitIds(productItems[0].productId, productQty);
    }

    // Generate order number
    const year = new Date().getFullYear();
    const lastOrder = await prisma.order.findFirst({
      where: { orderNumber: { contains: `ORD-${year}` } },
      orderBy: { createdAt: 'desc' },
    });

    const orderNumber = lastOrder
      ? `ORD-${year}-${String(parseInt(lastOrder.orderNumber.split('-')[2]) + 1).padStart(3, '0')}`
      : `ORD-${year}-001`;

    const deliveryDateTime = new Date(deliveryDate);
    const orderStatus = allStoreItems ? 'READY_FOR_DISPATCH' : 'PENDING_PLANNING';

    // Create order with line items in transaction
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          deliveryDate: deliveryDateTime,
          paymentTerms,
          priority: priority || 'NORMAL',
          status: orderStatus,
          generatedUnitIds: unitIds.length > 0 ? unitIds : undefined,
          createdById: session.user.id,
        },
      });

      // Create order line items
      for (const li of lineItems) {
        await tx.orderLineItem.create({
          data: {
            orderId: order.id,
            storeItemId: li.storeItemId || null,
            productId: li.productId || null,
            quantity: li.quantity,
            unitPrice: li.unitPrice || 0,
            totalAmount: (li.unitPrice || 0) * li.quantity,
          },
        });
      }

      return { order, unitIds };
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Created Order',
        module: 'Sales',
        details: {
          orderId: result.order.id,
          orderNumber: result.order.orderNumber,
          lineItemCount: lineItems.length,
          unitIdsGenerated: unitIds.length,
        },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 },
    );
  }
}
