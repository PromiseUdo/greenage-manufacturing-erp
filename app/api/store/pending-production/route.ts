// app/api/store/pending-production/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get completed production orders that haven't been received into store
    const pendingOrders = await prisma.productionOrder.findMany({
      where: {
        status: 'COMPLETED',
        storeReceiptCreated: false,
      },
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
          select: { id: true, name: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ pendingOrders });
  } catch (error) {
    console.error('Error fetching pending production receipts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending production receipts' },
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
      !['ADMIN', 'STORE_KEEPER', 'OPERATION_MANAGER'].includes(
        session.user.role
      )
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { productionOrderId } = body;

    if (!productionOrderId) {
      return NextResponse.json(
        { error: 'Production order ID is required' },
        { status: 400 }
      );
    }

    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            productNumber: true,
            category: true,
          },
        },
      },
    });

    if (!productionOrder) {
      return NextResponse.json(
        { error: 'Production order not found' },
        { status: 404 }
      );
    }

    if (productionOrder.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Production order is not completed' },
        { status: 400 }
      );
    }

    if (productionOrder.storeReceiptCreated) {
      return NextResponse.json(
        { error: 'Store receipt already created for this order' },
        { status: 400 }
      );
    }

    // Find the matching store item for this product
    let storeItem = productionOrder.product
      ? await prisma.storeItem.findFirst({
          where: {
            productId: productionOrder.product.id,
            isActive: true,
          },
        })
      : null;

    // If no store item exists for this product, create one
    if (!storeItem && productionOrder.product) {
      const lastStoreItem = await prisma.storeItem.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { itemNumber: true },
      });
      const itemCount = lastStoreItem
        ? parseInt(lastStoreItem.itemNumber.split('-')[1]) + 1
        : 1;
      const itemNumber = `STK-${itemCount.toString().padStart(4, '0')}`;

      storeItem = await prisma.storeItem.create({
        data: {
          itemNumber,
          name: productionOrder.product.name,
          productId: productionOrder.product.id,
          category: productionOrder.product.category,
          quantity: 0,
          unit: 'pcs',
          condition: 'NEW',
        },
      });
    }

    if (!storeItem) {
      return NextResponse.json(
        { error: 'Could not find or create store item for this product' },
        { status: 400 }
      );
    }

    // Generate receipt number
    const lastReceipt = await prisma.storeReceipt.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { receiptNumber: true },
    });

    const receiptCount = lastReceipt
      ? parseInt(lastReceipt.receiptNumber.split('-')[2]) + 1
      : 1;
    const receiptNumber = `SRN-${new Date().getFullYear()}-${receiptCount
      .toString()
      .padStart(4, '0')}`;

    // Use quantityPackaged (actual QC-approved) if available, otherwise fall back to planned quantity
    const po = productionOrder as any;
    const receiveQty: number = po.quantityPackaged ?? productionOrder.quantity;
    const yieldNote = po.quantityPackaged !== null && po.quantityPackaged !== undefined
      ? ` (Planned: ${productionOrder.quantity}, QC Approved & Packaged: ${po.quantityPackaged}${po.quantityRejected ? `, Rejected: ${po.quantityRejected}` : ''})`
      : '';

    // Create receipt and update stock in a transaction
    const receipt = await prisma.$transaction(async (tx) => {
      const newReceipt = await tx.storeReceipt.create({
        data: {
          receiptNumber,
          source: 'Production',
          referenceNumber: productionOrder.orderNumber,
          items: [
            {
              storeItemId: storeItem!.id,
              itemNumber: storeItem!.itemNumber,
              name: storeItem!.name,
              unit: storeItem!.unit,
              quantity: receiveQty,
              batchNumber: null,
              notes: `From production order ${productionOrder.orderNumber}${yieldNote}`,
            },
          ],
          receivedBy: session.user.name as string,
          notes: `Auto-received from production order ${productionOrder.orderNumber}.${yieldNote}`,
        },
      });

      // Update store item quantity with actual packaged units
      await tx.storeItem.update({
        where: { id: storeItem!.id },
        data: {
          quantity: {
            increment: receiveQty,
          },
        },
      });

      // Mark production order as received
      await tx.productionOrder.update({
        where: { id: productionOrderId },
        data: { storeReceiptCreated: true },
      });

      return newReceipt;
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Received Production into Store',
        module: 'Store',
        details: {
          receiptNumber: receipt.receiptNumber,
          productionOrderNumber: productionOrder.orderNumber,
          productName: productionOrder.product?.name,
          quantity: productionOrder.quantity,
          storeItemId: storeItem.id,
        },
      },
    });

    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    console.error('Error receiving production into store:', error);
    return NextResponse.json(
      { error: 'Failed to receive production into store' },
      { status: 500 }
    );
  }
}
