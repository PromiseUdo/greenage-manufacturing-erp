// src/app/api/quotes/[id]/accept/route.ts

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

    if (quote.isAccepted) {
      return NextResponse.json(
        { error: 'Quote already accepted' },
        { status: 400 },
      );
    }

    // ✅ ACCEPT QUOTE AND CREATE FULL INVOICE
    const result = await prisma.$transaction(async (tx) => {
      // Update quote status
      const updatedQuote = await tx.quote.update({
        where: { id: quoteId },
        data: {
          isAccepted: true,
          acceptedAt: new Date(),
          acceptedBy: session.user.name,
          status: 'ACCEPTED',
        },
      });

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

      // ✅ Create invoice with full quote totals
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          quoteId,
          customerId: quote.customerId,
          totalAmount: quote.totalAmount,
          taxAmount: quote.taxAmount,
          discountAmount: quote.discountAmount,
          finalAmount: quote.finalAmount,
          balanceAmount: quote.finalAmount,
          paymentTerms: quote.paymentTerms,
          dueDate,
          status: 'PENDING',
          createdById: session.user.id,
        },
      });

      // ✅ Create InvoiceLineItems from ALL QuoteLineItems at full quantity
      for (const qli of quote.lineItems) {
        await tx.invoiceLineItem.create({
          data: {
            invoiceId: invoice.id,
            storeItemId: qli.storeItemId,
            productId: qli.productId,
            quantity: qli.quantity,
            unitPrice: qli.unitPrice,
            totalAmount: qli.unitPrice * qli.quantity,
          },
        });
      }

      return { quote: updatedQuote, invoice };
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Accepted Quote',
        module: 'Sales',
        details: {
          quoteId,
          quoteNumber: quote.quoteNumber,
          invoiceId: result.invoice.id,
          invoiceNumber: result.invoice.invoiceNumber,
          lineItemCount: quote.lineItems.length,
        },
      },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error accepting quote:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to accept quote' },
      { status: 500 },
    );
  }
}
