
// src/app/api/quotes/route.ts - Multi-line item support

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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
    const customerId = searchParams.get('customerId') || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { lineItems: { some: { storeItem: { name: { contains: search, mode: 'insensitive' } } } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
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
                  productCode: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.quote.count({ where }),
    ]);

    return NextResponse.json({
      quotes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 },
    );
  }
}

interface LineItemInput {
  storeItemId: string;
  quantity: number;
  unitPrice?: number;
}

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
      taxAmount,
      discountAmount,
      paymentTerms,
      expiryDate,
      notes,
      termsConditions,
    } = body;

    // Validation
    if (!customerId || !lineItems || !Array.isArray(lineItems) || lineItems.length === 0 || !deliveryDate) {
      return NextResponse.json(
        {
          error: 'Customer, at least one line item, and delivery date are required',
        },
        { status: 400 },
      );
    }

    // Validate each line item
    for (const item of lineItems as LineItemInput[]) {
      if (!item.storeItemId || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { error: 'Each line item must have a store item and quantity >= 1' },
          { status: 400 },
        );
      }
    }

    // Fetch all store items referenced
    const storeItemIds = (lineItems as LineItemInput[]).map((li) => li.storeItemId);
    const storeItemRecords = await prisma.storeItem.findMany({
      where: { id: { in: storeItemIds } },
      select: { id: true, unitPrice: true, name: true, productId: true, quantity: true },
    });

    const storeItemMap = new Map(storeItemRecords.map((s) => [s.id, s]));

    // Check all items exist
    for (const item of lineItems as LineItemInput[]) {
      if (!storeItemMap.has(item.storeItemId)) {
        return NextResponse.json(
          { error: `Store item not found: ${item.storeItemId}` },
          { status: 404 },
        );
      }
    }

    // Calculate line item totals
    const processedItems = (lineItems as LineItemInput[]).map((item) => {
      const storeItem = storeItemMap.get(item.storeItemId)!;
      const itemUnitPrice = item.unitPrice || storeItem.unitPrice || 0;
      const itemTotal = itemUnitPrice * item.quantity;
      return { ...item, unitPrice: itemUnitPrice, totalAmount: itemTotal, storeItem };
    });

    // Quote-level aggregates
    const subtotal = processedItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const finalTax = taxAmount || 0;
    const finalDiscount = discountAmount || 0;
    const finalAmount = subtotal + finalTax - finalDiscount;

    // Generate quote number
    const year = new Date().getFullYear();
    const lastQuote = await prisma.quote.findFirst({
      where: {
        quoteNumber: { contains: `QTE-${year}` },
      },
      orderBy: { createdAt: 'desc' },
    });

    let quoteNumber;
    if (lastQuote) {
      const lastNumber = parseInt(lastQuote.quoteNumber.split('-')[2]);
      quoteNumber = `QTE-${year}-${String(lastNumber + 1).padStart(3, '0')}`;
    } else {
      quoteNumber = `QTE-${year}-001`;
    }

    const deliveryDateTime = new Date(deliveryDate);
    const expiryDateTime = expiryDate ? new Date(expiryDate) : null;

    const result = await prisma.$transaction(async (tx) => {
      // Create the quote (header)
      const quote = await tx.quote.create({
        data: {
          quoteNumber,
          customerId,
          deliveryDate: deliveryDateTime,
          totalAmount: subtotal,
          taxAmount: finalTax,
          discountAmount: finalDiscount,
          finalAmount,
          paymentTerms,
          status: 'DRAFT',
          expiryDate: expiryDateTime,
          notes,
          termsConditions,
          createdById: session.user.id,
        },
      });

      // Process each line item
      const createdLineItems = [];

      for (const item of processedItems) {
        const storeItem = item.storeItem;
        const availableStock = storeItem.quantity;

        // Stock split logic
        let quantityAllocated = item.quantity;
        let quantityBackordered = 0;
        let backorderStatus: 'NONE' | 'PENDING' = 'NONE';
        let backorderCreatedAt: Date | null = null;

        if (item.quantity <= availableStock) {
          quantityAllocated = item.quantity;
          quantityBackordered = 0;
          backorderStatus = 'NONE';
        } else {
          quantityAllocated = availableStock;
          quantityBackordered = item.quantity - availableStock;
          backorderStatus = 'PENDING';
          backorderCreatedAt = new Date();
        }

        // Do not deduct stock in the database (handled via dispatches).
        // Update local tracker so subsequent items referencing the same storeItem get correct stock
        if (quantityAllocated > 0) {
          storeItem.quantity -= quantityAllocated;
        }

        // Create line item
        const lineItem = await tx.quoteLineItem.create({
          data: {
            quoteId: quote.id,
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

        createdLineItems.push(lineItem);
      }

      // Fetch the full quote with relations
      const fullQuote = await tx.quote.findUnique({
        where: { id: quote.id },
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

      return { quote: fullQuote };
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Created Quote',
        module: 'Sales',
        details: {
          quoteId: result.quote!.id,
          quoteNumber: result.quote!.quoteNumber,
          customerId,
          lineItemCount: (lineItems as LineItemInput[]).length,
          totalAmount: subtotal,
          finalAmount,
        },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create quote' },
      { status: 500 },
    );
  }
}

