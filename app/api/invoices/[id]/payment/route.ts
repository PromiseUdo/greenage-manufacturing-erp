// src/app/api/invoices/[id]/payment/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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
      // Update invoice
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
        },
      });

      // Sync order payment status
      await tx.order.update({
        where: { id: invoice.orderId },
        data: {
          paymentStatus: newPaymentStatus,
        },
      });

      return updatedInvoice;
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
        },
      },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record payment' },
      { status: 500 },
    );
  }
}
