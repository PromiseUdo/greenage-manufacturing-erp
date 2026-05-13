import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  const where: any = { customerId: customer.id };
  if (status) where.status = status;
  if (search) {
    where.quoteNumber = { contains: search, mode: 'insensitive' };
  }

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        quoteNumber: true,
        finalAmount: true,
        totalAmount: true,
        taxAmount: true,
        discountAmount: true,
        status: true,
        isAccepted: true,
        deliveryDate: true,
        expiryDate: true,
        createdAt: true,
        invoice: { select: { id: true, invoiceNumber: true } },
        lineItems: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            storeItem: { select: { id: true, name: true, itemNumber: true } },
          },
        },
      },
    }),
    prisma.quote.count({ where }),
  ]);

  return NextResponse.json({
    quotes,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
