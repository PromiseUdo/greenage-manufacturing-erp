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
  if (status) where.paymentStatus = status;
  if (search) {
    where.invoiceNumber = { contains: search, mode: 'insensitive' };
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        invoiceNumber: true,
        finalAmount: true,
        totalAmount: true,
        taxAmount: true,
        discountAmount: true,
        paidAmount: true,
        balanceAmount: true,
        paymentStatus: true,
        paymentMethod: true,
        status: true,
        issueDate: true,
        dueDate: true,
        paidAt: true,
        createdAt: true,
        quote: { select: { id: true, quoteNumber: true } },
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
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json({
    invoices,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
