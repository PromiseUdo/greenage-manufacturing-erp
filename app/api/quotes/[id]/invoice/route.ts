// src/app/api/quotes/[id]/invoice/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const params = await context.params;
  const { id: quoteId } = params;

  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dueInDays = 30 } = body;

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        customer: true,
        lineItems: {
          include: {
            storeItem: true,
            product: true,
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    if (quote.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Quote must be accepted to generate an invoice' },
        { status: 400 },
      );
    }

    // ✅ FIND UNBILLED STOCK AND CREATE INVOICE
    const result = await prisma.$transaction(async (tx) => {
      // Calculate the portion of the quote that can be invoiced right now (allocated stock not yet invoiced)
      let invoicedTotalAmount = 0;
      const invoiceLineItemsData = [];

      for (const qli of quote.lineItems) {
        const qtyToInvoice = (qli.quantityAllocated || 0) - (qli.quantityInvoiced || 0);
        
        if (qtyToInvoice > 0) {
          const liTotal = qli.unitPrice * qtyToInvoice;
          invoicedTotalAmount += liTotal;

          invoiceLineItemsData.push({
            quoteLineItemId: qli.id,
            storeItemId: qli.storeItemId,
            productId: qli.productId,
            quantity: qtyToInvoice,
            unitPrice: qli.unitPrice,
            totalAmount: liTotal,
          });
        }
      }

      // If nothing is pending to invoice, return an error
      if (invoiceLineItemsData.length === 0) {
        throw new Error('No unbilled allocated items available to invoice.');
      }

      // Generate invoice number
      const year = new Date().getFullYear();
      const lastInvoice = await tx.invoice.findFirst({
        where: {
          invoiceNumber: { contains: `INV-${year}` },
        },
        orderBy: { createdAt: 'desc' },
      });

      let invoiceNumber;
      if (lastInvoice) {
        const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
        invoiceNumber = `INV-${year}-${String(lastNumber + 1).padStart(3, '0')}`;
      } else {
        invoiceNumber = `INV-${year}-001`;
      }

      // Calculate due date
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueInDays);

      // Calculate proportionate tax, discount, and final amounts
      const invoiceRatio = quote.totalAmount > 0 ? invoicedTotalAmount / quote.totalAmount : 0;
      const invoicedTaxAmount = quote.taxAmount * invoiceRatio;
      const invoicedDiscountAmount = quote.discountAmount * invoiceRatio;
      const invoicedFinalAmount = invoicedTotalAmount + invoicedTaxAmount - invoicedDiscountAmount;

      // ✅ Create invoice (header only — no single-item fields)
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          quoteId,
          customerId: quote.customerId,
          totalAmount: invoicedTotalAmount,
          taxAmount: invoicedTaxAmount,
          discountAmount: invoicedDiscountAmount,
          finalAmount: invoicedFinalAmount,
          balanceAmount: invoicedFinalAmount,
          paymentTerms: quote.paymentTerms,
          dueDate,
          status: 'PENDING',
          createdById: session.user.id,
        },
      });

      // ✅ Create InvoiceLineItems and update QuoteLineItems quantityInvoiced
      for (const itemData of invoiceLineItemsData) {
        await tx.invoiceLineItem.create({
          data: {
            invoiceId: invoice.id,
            storeItemId: itemData.storeItemId,
            productId: itemData.productId,
            quantity: itemData.quantity,
            unitPrice: itemData.unitPrice,
            totalAmount: itemData.totalAmount,
          },
        });

        // Update the quote line item to reflect what has been invoiced
        await tx.quoteLineItem.update({
          where: { id: itemData.quoteLineItemId },
          data: {
            quantityInvoiced: { increment: itemData.quantity },
          },
        });
      }

      return { invoice };
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Generated Partial Invoice',
        module: 'Sales',
        details: {
          quoteId,
          quoteNumber: quote.quoteNumber,
          invoiceId: result.invoice.id,
          invoiceNumber: result.invoice.invoiceNumber,
        },
      },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error creating partial invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create partial invoice' },
      { status: 500 },
    );
  }
}
