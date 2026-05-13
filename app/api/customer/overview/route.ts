import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
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

  const [quotes, invoices, orders] = await Promise.all([
    prisma.quote.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        quoteNumber: true,
        finalAmount: true,
        status: true,
        createdAt: true,
        lineItems: {
          take: 1,
          select: {
            storeItem: { select: { name: true } },
          },
        },
      },
    }),

    prisma.invoice.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        finalAmount: true,
        paidAmount: true,
        balanceAmount: true,
        paymentStatus: true,
        status: true,
        dueDate: true,
        createdAt: true,
      },
    }),

    prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        deliveryDate: true,
        lineItems: {
          take: 1,
          select: {
            storeItem: { select: { name: true } },
            quantity: true,
          },
        },
      },
    }),
  ]);

  const [quoteCount, invoiceCount, orderCount, totalInvoiced, totalPaid, outstandingBalance] =
    await Promise.all([
      prisma.quote.count({ where: { customerId: customer.id } }),
      prisma.invoice.count({ where: { customerId: customer.id } }),
      prisma.order.count({ where: { customerId: customer.id } }),
      prisma.invoice
        .aggregate({ where: { customerId: customer.id }, _sum: { finalAmount: true } })
        .then((r) => r._sum.finalAmount ?? 0),
      prisma.invoice
        .aggregate({ where: { customerId: customer.id }, _sum: { paidAmount: true } })
        .then((r) => r._sum.paidAmount ?? 0),
      prisma.invoice
        .aggregate({ where: { customerId: customer.id }, _sum: { balanceAmount: true } })
        .then((r) => r._sum.balanceAmount ?? 0),
    ]);

  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
    },
    stats: {
      quoteCount,
      invoiceCount,
      orderCount,
      totalInvoiced,
      totalPaid,
      outstandingBalance,
    },
    recentQuotes: quotes,
    recentInvoices: invoices,
    recentOrders: orders,
  });
}
