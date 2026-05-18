import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface OrderItem {
  storeItemId: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customer = await prisma.customer.findFirst({
    where: { userId: session.user.id },
  });

  if (!customer) {
    return NextResponse.json({ error: 'Customer account not found' }, { status: 404 });
  }

  const body = await req.json();
  const { items, notes } = body as { items: OrderItem[]; notes?: string };

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
  }

  for (const item of items) {
    if (!item.storeItemId || !item.quantity || item.quantity < 1) {
      return NextResponse.json(
        { error: 'Each item must have a valid storeItemId and quantity >= 1' },
        { status: 400 },
      );
    }
  }

  // Fetch all store items and validate availability
  const storeItemIds = items.map((i) => i.storeItemId);
  const storeItems = await prisma.storeItem.findMany({
    where: { id: { in: storeItemIds }, isActive: true },
    select: {
      id: true,
      name: true,
      quantity: true,
      unitPrice: true,
      productId: true,
      condition: true,
    },
  });

  if (storeItems.length !== storeItemIds.length) {
    return NextResponse.json(
      { error: 'One or more items are unavailable or do not exist' },
      { status: 400 },
    );
  }

  const storeItemMap = new Map(storeItems.map((s) => [s.id, s]));

  // Validate stock quantities
  for (const item of items) {
    const storeItem = storeItemMap.get(item.storeItemId)!;
    if (storeItem.quantity < item.quantity) {
      return NextResponse.json(
        {
          error: `Insufficient stock for "${storeItem.name}". Available: ${storeItem.quantity}, requested: ${item.quantity}`,
        },
        { status: 400 },
      );
    }
  }

  const processedItems = items.map((item) => {
    const storeItem = storeItemMap.get(item.storeItemId)!;
    const unitPrice = storeItem.unitPrice ?? 0;
    return {
      storeItemId: item.storeItemId,
      productId: storeItem.productId ?? undefined,
      quantity: item.quantity,
      unitPrice,
      totalAmount: unitPrice * item.quantity,
    };
  });

  const subtotal = processedItems.reduce((sum, i) => sum + i.totalAmount, 0);

  // Generate quote number: QTE-YYYY-NNN
  const year = new Date().getFullYear();
  const lastQuote = await prisma.quote.findFirst({
    where: { quoteNumber: { startsWith: `QTE-${year}-` } },
    orderBy: { createdAt: 'desc' },
    select: { quoteNumber: true },
  });

  let quoteNumber: string;
  if (lastQuote) {
    const lastSeq = parseInt(lastQuote.quoteNumber.split('-')[2] || '0', 10);
    quoteNumber = `QTE-${year}-${String(lastSeq + 1).padStart(3, '0')}`;
  } else {
    quoteNumber = `QTE-${year}-001`;
  }

  // Default delivery 30 days out; admin will confirm
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 30);

  const quote = await prisma.$transaction(async (tx) => {
    const newQuote = await tx.quote.create({
      data: {
        quoteNumber,
        customerId: customer.id,
        deliveryDate,
        totalAmount: subtotal,
        taxAmount: 0,
        discountAmount: 0,
        finalAmount: subtotal,
        status: 'DRAFT',
        notes: notes || null,
        createdById: session.user.id,
      },
    });

    await tx.quoteLineItem.createMany({
      data: processedItems.map((item) => ({
        quoteId: newQuote.id,
        storeItemId: item.storeItemId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: item.totalAmount,
        backorderStatus: 'NONE',
      })),
    });

    return newQuote;
  });

  return NextResponse.json(
    {
      success: true,
      quoteNumber: quote.quoteNumber,
      quoteId: quote.id,
      message:
        'Your order request has been received. We will review and send you a formal quote shortly.',
    },
    { status: 201 },
  );
}
