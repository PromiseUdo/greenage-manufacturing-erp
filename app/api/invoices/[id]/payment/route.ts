// src/app/api/invoices/[id]/payment/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateUnitIds } from '@/lib/unitIdGenerator';

export async function POST(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const params = await context.params;
  const { id: invoiceId } = params;

  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, paymentMethod, paymentReference, notes } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid payment amount is required' },
        { status: 400 },
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        order: true,
        quote: true,
        lineItems: {
          include: {
            storeItem: true,
            product: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Calculate new amounts
    const newPaidAmount = invoice.paidAmount + amount;
    const newBalanceAmount = invoice.finalAmount - newPaidAmount;

    if (newPaidAmount > invoice.finalAmount) {
      return NextResponse.json(
        { error: 'Payment amount exceeds invoice total' },
        { status: 400 },
      );
    }

    // Determine new status
    let newStatus: any = invoice.status;
    let newPaymentStatus: any = invoice.paymentStatus;

    if (newBalanceAmount === 0) {
      newStatus = 'PAID';
      newPaymentStatus = 'PAID';
    } else if (newPaidAmount > 0 && newBalanceAmount > 0) {
      newStatus = 'PARTIALLY_PAID';
      newPaymentStatus = 'PARTIAL';
    }

    // Update invoice and order in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Order if it doesn't exist
      let orderId = invoice.orderId;
      let newOrder = null;

      if (!orderId) {
        // Generate order number
        const year = new Date().getFullYear();
        const lastOrder = await tx.order.findFirst({
          where: { orderNumber: { contains: `ORD-${year}` } },
          orderBy: { createdAt: 'desc' },
        });

        const orderNumber = lastOrder
          ? `ORD-${year}-${String(parseInt(lastOrder.orderNumber.split('-')[2]) + 1).padStart(3, '0')}`
          : `ORD-${year}-001`;

        // Compute total quantity from line items
        const totalQuantity = invoice.lineItems.reduce((sum, li) => sum + li.quantity, 0);

        // Check if any line item has a product that needs production
        const hasProductItems = invoice.lineItems.some(li => li.productId && !li.storeItemId);
        const allStoreItems = invoice.lineItems.every(li => li.storeItemId);

        // Generate unit IDs ONLY for product items (not store items)
        let unitIds: string[] = [];
        if (hasProductItems) {
          // Generate unit IDs for the first product found (for production tracking)
          const productItem = invoice.lineItems.find(li => li.productId);
          if (productItem?.productId) {
            const productQty = invoice.lineItems
              .filter(li => li.productId && !li.storeItemId)
              .reduce((sum, li) => sum + li.quantity, 0);
            unitIds = await generateUnitIds(productItem.productId, productQty);
          }
        }

        // Determine status: store items are ready for dispatch, products need planning
        const orderStatus = allStoreItems ? 'READY_FOR_DISPATCH' : 'PENDING_PLANNING';

        // Create Order (header only)
        newOrder = await tx.order.create({
          data: {
            orderNumber,
            customerId: invoice.customerId,
            deliveryDate: invoice.quote?.deliveryDate || new Date(),
            paymentTerms: invoice.paymentTerms,
            priority: 'NORMAL',
            status: orderStatus,
            generatedUnitIds: unitIds.length > 0 ? unitIds : undefined,
            createdById: session.user.id,
            paymentStatus: newPaymentStatus,
          },
        });

        orderId = newOrder.id;

        // ✅ Create OrderLineItems from InvoiceLineItems
        for (const ili of invoice.lineItems) {
          await tx.orderLineItem.create({
            data: {
              orderId: newOrder.id,
              storeItemId: ili.storeItemId,
              productId: ili.productId,
              quantity: ili.quantity,
              unitPrice: ili.unitPrice,
              totalAmount: ili.unitPrice * ili.quantity,
            },
          });
        }
      } else {
        // Update existing order payment status
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: newPaymentStatus,
          },
        });
      }

      // 2. Update Invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          status: newStatus,
          paymentStatus: newPaymentStatus,
          ...(newStatus === 'PAID' &&
            !invoice.paidAt && { paidAt: new Date() }),
          ...(paymentMethod && { paymentMethod }),
          ...(paymentReference && { paymentReference }),
          orderId: orderId, // Link order if newly created
        },
      });

      return { updatedInvoice, newOrder };
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Recorded Payment',
        module: 'Invoices',
        details: {
          invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          amount,
          paymentMethod,
          newPaidAmount,
          newBalanceAmount,
          newStatus,
          orderCreated: !!result.newOrder,
          orderNumber: result.newOrder?.orderNumber,
        },
      },
    });

    return NextResponse.json(result.updatedInvoice);
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record payment' },
      { status: 500 },
    );
  }
}
