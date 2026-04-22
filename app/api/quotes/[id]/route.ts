// src/app/api/quotes/[id]/route.ts

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

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        lineItems: {
          include: {
            storeItem: true,
            product: {
              select: {
                id: true,
                name: true,
                productNumber: true,
                productCode: true,
                category: true,
                model: true,
                specifications: true,
              },
            },
            productionRequests: {
              select: {
                id: true,
                requestNumber: true,
                quantityNeeded: true,
                status: true,
                dateRaised: true,
                dateCompleted: true,
              },
            },
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            paidAmount: true,
            balanceAmount: true,
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

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
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
    const { status, notes } = body;

    const quote = await prisma.quote.findUnique({ where: { id } });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating quote:', error);
    return NextResponse.json(
      { error: 'Failed to update quote' },
      { status: 500 },
    );
  }
}



interface LineItemInput {
  storeItemId: string;
  quantity: number;
  unitPrice?: number;
}

export async function PUT(
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

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }
    if (quote.isAccepted) {
      return NextResponse.json(
        { error: 'Accepted quotes cannot be edited' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      customerId,
      lineItems,
      deliveryDate,
      taxAmount,
      discountAmount,
      paymentTerms,
      expiryDate,
      notes,
      termsConditions,
    } = body;

    if (!customerId || !lineItems || !Array.isArray(lineItems) || lineItems.length === 0 || !deliveryDate) {
      return NextResponse.json(
        { error: 'Customer, at least one line item, and delivery date are required' },
        { status: 400 },
      );
    }

    for (const item of lineItems as LineItemInput[]) {
      if (!item.storeItemId || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { error: 'Each line item must have a store item and quantity >= 1' },
          { status: 400 },
        );
      }
    }

    const storeItemIds = (lineItems as LineItemInput[]).map((li) => li.storeItemId);
    const storeItemRecords = await prisma.storeItem.findMany({
      where: { id: { in: storeItemIds } },
      select: { id: true, unitPrice: true, name: true, productId: true, quantity: true },
    });

    const storeItemMap = new Map(storeItemRecords.map((s) => [s.id, s]));

    for (const item of lineItems as LineItemInput[]) {
      if (!storeItemMap.has(item.storeItemId)) {
        return NextResponse.json(
          { error: `Store item not found: ${item.storeItemId}` },
          { status: 404 },
        );
      }
    }

    const processedItems = (lineItems as LineItemInput[]).map((item) => {
      const storeItem = storeItemMap.get(item.storeItemId)!;
      const itemUnitPrice = item.unitPrice || storeItem.unitPrice || 0;
      return { ...item, unitPrice: itemUnitPrice, totalAmount: itemUnitPrice * item.quantity, storeItem: { ...storeItem } };
    });

    const subtotal = processedItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const finalTax = taxAmount || 0;
    const finalDiscount = discountAmount || 0;
    const finalAmount = subtotal + finalTax - finalDiscount;

    const result = await prisma.$transaction(async (tx) => {
      await tx.quoteLineItem.deleteMany({ where: { quoteId: id } });

      const updatedQuote = await tx.quote.update({
        where: { id },
        data: {
          customerId,
          deliveryDate: new Date(deliveryDate),
          totalAmount: subtotal,
          taxAmount: finalTax,
          discountAmount: finalDiscount,
          finalAmount,
          paymentTerms,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          notes,
          termsConditions,
        },
      });

      for (const item of processedItems) {
        const storeItem = item.storeItem;
        const availableStock = storeItem.quantity;

        let quantityAllocated = item.quantity;
        let quantityBackordered = 0;
        let backorderStatus: 'NONE' | 'PENDING' = 'NONE';
        let backorderCreatedAt: Date | null = null;

        if (item.quantity <= availableStock) {
          quantityAllocated = item.quantity;
        } else {
          quantityAllocated = availableStock;
          quantityBackordered = item.quantity - availableStock;
          backorderStatus = 'PENDING';
          backorderCreatedAt = new Date();
        }

        if (quantityAllocated > 0) storeItem.quantity -= quantityAllocated;

        await tx.quoteLineItem.create({
          data: {
            quoteId: id,
            storeItemId: storeItem.id,
            productId: storeItem.productId || undefined,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalAmount: item.totalAmount,
            quantityAllocated,
            quantityBackordered,
            backorderStatus,
            backorderCreatedAt,
          },
        });
      }

      return updatedQuote;
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Updated Quote',
        module: 'Sales',
        details: {
          quoteId: id,
          quoteNumber: result.quoteNumber,
          lineItemCount: (lineItems as LineItemInput[]).length,
          finalAmount,
        },
      },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating quote:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update quote' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    console.log('SESSION USER:', session.user);


    // if (
    //   !['ADMIN', 'PRODUCTION_MANAGER'].includes(session.user.role) &&
    //   !session.user.permissions?.includes('sales:delete')
    // ) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }


    if (!session.user.permissions?.includes('sales:delete')) {
  return NextResponse.json({ error: 'You do not have permission to delete quotes.' }, { status: 403 });
}


 // Fetch user with role + permissions from DB


    const { id } = await params;

    const quote = await prisma.quote.findUnique({
      where: { id },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    if (quote.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only DRAFT quotes can be deleted' },
        { status: 400 }
      );
    }


      // Delete order
      await prisma.quote.delete({
        where: { id },
      });
      

    

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Deleted Quote',
        module: 'Sales',
        details: {
          quoteNumber: quote.quoteNumber,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting production order:', error);
    return NextResponse.json(
      { error: 'Failed to delete production order' },
      { status: 500 }
    );
  }
}