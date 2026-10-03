// src/app/api/invoices/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { isAdminOrSuperAdmin } from '@/lib/permissions';

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

    const invoice = await prisma.invoice.findUnique({
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
        quote: {
          select: {
            id: true,
            quoteNumber: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            generatedUnitIds: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: {
          include: {
            recordedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
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

    if (!isAdminOrSuperAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Only admins can edit invoices' },
        { status: 403 },
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { lineItems: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const body = await request.json();
    const { dueDate, paymentTerms, notes, taxAmount, discountAmount, lineItems } =
      body;

    const data: Record<string, any> = {};

    if (dueDate !== undefined) {
      const parsed = new Date(dueDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'Invalid due date' }, { status: 400 });
      }
      data.dueDate = parsed;
    }
    if (paymentTerms !== undefined) data.paymentTerms = paymentTerms || null;
    if (notes !== undefined) data.notes = notes || null;

    // Pricing changes. The first payment copies line items into an Order,
    // so pricing is locked once an order exists to keep the two in sync.
    const pricingChanged =
      taxAmount !== undefined ||
      discountAmount !== undefined ||
      lineItems !== undefined;

    const priceUpdates = new Map<string, number>();

    if (pricingChanged) {
      if (invoice.orderId) {
        return NextResponse.json(
          {
            error:
              'Prices cannot be changed after payment has started (an order has been created)',
          },
          { status: 400 },
        );
      }

      if (lineItems !== undefined) {
        if (!Array.isArray(lineItems)) {
          return NextResponse.json(
            { error: 'lineItems must be an array' },
            { status: 400 },
          );
        }
        const existingIds = new Set(invoice.lineItems.map((li) => li.id));
        for (const li of lineItems) {
          const price = Number(li?.unitPrice);
          if (!existingIds.has(li?.id)) {
            return NextResponse.json(
              { error: `Line item not found on this invoice: ${li?.id}` },
              { status: 400 },
            );
          }
          if (!Number.isFinite(price) || price < 0) {
            return NextResponse.json(
              { error: 'Unit prices must be zero or greater' },
              { status: 400 },
            );
          }
          priceUpdates.set(li.id, price);
        }
      }

      const newTax =
        taxAmount !== undefined ? Number(taxAmount) : invoice.taxAmount;
      const newDiscount =
        discountAmount !== undefined
          ? Number(discountAmount)
          : invoice.discountAmount;

      if (!Number.isFinite(newTax) || newTax < 0) {
        return NextResponse.json(
          { error: 'Tax must be zero or greater' },
          { status: 400 },
        );
      }
      if (!Number.isFinite(newDiscount) || newDiscount < 0) {
        return NextResponse.json(
          { error: 'Discount must be zero or greater' },
          { status: 400 },
        );
      }

      const subtotal = invoice.lineItems.reduce(
        (sum, li) => sum + (priceUpdates.get(li.id) ?? li.unitPrice) * li.quantity,
        0,
      );
      const finalAmount = subtotal + newTax - newDiscount;

      if (finalAmount < 0) {
        return NextResponse.json(
          { error: 'Discount cannot exceed subtotal plus tax' },
          { status: 400 },
        );
      }
      if (finalAmount < invoice.paidAmount) {
        return NextResponse.json(
          { error: 'Invoice total cannot be less than the amount already paid' },
          { status: 400 },
        );
      }

      data.totalAmount = subtotal;
      data.taxAmount = newTax;
      data.discountAmount = newDiscount;
      data.finalAmount = finalAmount;
      data.balanceAmount = finalAmount - invoice.paidAmount;
    }

    const updatedInvoice = await prisma.$transaction(async (tx) => {
      for (const [lineItemId, unitPrice] of priceUpdates) {
        const li = invoice.lineItems.find((l) => l.id === lineItemId)!;
        await tx.invoiceLineItem.update({
          where: { id: lineItemId },
          data: { unitPrice, totalAmount: unitPrice * li.quantity },
        });
      }

      return tx.invoice.update({ where: { id }, data });
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Updated Invoice',
        module: 'Sales',
        details: {
          invoiceId: id,
          invoiceNumber: invoice.invoiceNumber,
          changedFields: Object.keys(data),
          previous: {
            dueDate: invoice.dueDate.toISOString(),
            paymentTerms: invoice.paymentTerms,
            notes: invoice.notes,
            taxAmount: invoice.taxAmount,
            discountAmount: invoice.discountAmount,
            finalAmount: invoice.finalAmount,
            lineItemPrices: invoice.lineItems
              .filter((li) => priceUpdates.has(li.id))
              .map((li) => ({ id: li.id, unitPrice: li.unitPrice })),
          },
        },
      },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    if (!isAdminOrSuperAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Only admins can delete invoices' },
        { status: 403 },
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
        quote: { select: { id: true, quoteNumber: true } },
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Invoices that have moved into fulfilment are referenced elsewhere;
    // deleting them would leave orders/dispatches pointing at nothing.
    if (invoice.orderId) {
      return NextResponse.json(
        { error: 'Cannot delete an invoice that is linked to an order' },
        { status: 400 },
      );
    }

    const dispatchCount = await prisma.storeDispatch.count({
      where: { invoiceId: id },
    });

    if (dispatchCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete an invoice that has store dispatches' },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.invoicePayment.deleteMany({ where: { invoiceId: id } }),
      prisma.invoiceLineItem.deleteMany({ where: { invoiceId: id } }),
      prisma.invoice.delete({ where: { id } }),
    ]);

    // Log activity (payments are snapshotted since they are deleted with the invoice)
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Deleted Invoice',
        module: 'Sales',
        details: {
          invoiceId: id,
          invoiceNumber: invoice.invoiceNumber,
          customerId: invoice.customer.id,
          customerName: invoice.customer.name,
          quoteNumber: invoice.quote?.quoteNumber ?? null,
          finalAmount: invoice.finalAmount,
          paidAmount: invoice.paidAmount,
          payments: invoice.payments.map((p) => ({
            amount: p.amount,
            paymentMethod: p.paymentMethod,
            reference: p.reference,
            paymentDate: p.paymentDate.toISOString(),
            recordedById: p.recordedById,
          })),
        },
      },
    });

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 },
    );
  }
}
