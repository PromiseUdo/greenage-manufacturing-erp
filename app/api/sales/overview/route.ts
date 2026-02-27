// app/api/sales/overview/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { startOfMonth, subMonths, format, startOfDay, subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '12m'; // 7d | 30d | 90d | 12m

    // Determine the date range for the selected period
    const now = new Date();
    let periodStart: Date;
    switch (period) {
      case '7d':
        periodStart = startOfDay(subDays(now, 7));
        break;
      case '30d':
        periodStart = startOfDay(subDays(now, 30));
        break;
      case '90d':
        periodStart = startOfDay(subDays(now, 90));
        break;
      case '12m':
      default:
        periodStart = startOfMonth(subMonths(now, 11));
        break;
    }

    // ──────────────────────────────────────────────────────────────
    // Run all queries in parallel
    // ──────────────────────────────────────────────────────────────
    const [
      allInvoices,
      allQuotes,
      allOrders,
      allCustomers,
      recentQuotes,
    ] = await Promise.all([
      // All invoices within the period (for revenue calculations)
      prisma.invoice.findMany({
        where: { createdAt: { gte: periodStart } },
        select: {
          id: true,
          finalAmount: true,
          paidAmount: true,
          balanceAmount: true,
          paymentStatus: true,
          status: true,
          issueDate: true,
          createdAt: true,
          customer: { select: { id: true, name: true } },
        },
      }),

      // All quotes within the period
      prisma.quote.findMany({
        where: { createdAt: { gte: periodStart } },
        select: {
          id: true,
          status: true,
          finalAmount: true,
          createdAt: true,
          customer: { select: { id: true, name: true } },
        },
      }),

      // All orders within the period
      prisma.order.findMany({
        where: { createdAt: { gte: periodStart } },
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      }),

      // All customers (for top-customer aggregation)
      prisma.customer.findMany({
        select: {
          id: true,
          name: true,
          invoices: {
            where: { createdAt: { gte: periodStart } },
            select: { finalAmount: true, paidAmount: true, createdAt: true },
          },
          quotes: {
            where: { createdAt: { gte: periodStart } },
            select: { id: true },
          },
          orders: {
            where: { createdAt: { gte: periodStart } },
            select: { id: true, createdAt: true },
          },
        },
      }),

      // Recent 5 quotes (not filtered by period)
      prisma.quote.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          quoteNumber: true,
          status: true,
          finalAmount: true,
          createdAt: true,
          customer: { select: { id: true, name: true } },
          lineItems: {
            take: 1,
            select: { storeItem: { select: { name: true } } },
          },
        },
      }),
    ]);

    // ──────────────────────────────────────────────────────────────
    // KPI Calculations
    // ──────────────────────────────────────────────────────────────

    const totalRevenue = allInvoices
      .filter((inv) => inv.paymentStatus === 'PAID' || inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.finalAmount, 0);

    const totalPaidAmount = allInvoices.reduce(
      (sum, inv) => sum + (inv.paidAmount || 0),
      0,
    );

    const outstandingReceivables = allInvoices
      .filter(
        (inv) =>
          inv.paymentStatus === 'PENDING' ||
          inv.paymentStatus === 'PARTIAL' ||
          inv.paymentStatus === 'OVERDUE',
      )
      .reduce((sum, inv) => sum + (inv.balanceAmount || inv.finalAmount), 0);

    const totalQuotes = allQuotes.length;
    const convertedQuotes = allQuotes.filter(
      (q) => q.status === 'CONVERTED' || q.status === 'ACCEPTED',
    ).length;
    const quoteConversionRate =
      totalQuotes > 0
        ? Math.round((convertedQuotes / totalQuotes) * 100)
        : 0;

    const totalOrders = allOrders.length;
    const activeOrders = allOrders.filter(
      (o) =>
        o.status !== 'DELIVERED' &&
        o.status !== 'CANCELLED' &&
        o.status !== 'DISPATCHED',
    ).length;

    const totalInvoiceValue = allInvoices.reduce(
      (sum, inv) => sum + inv.finalAmount,
      0,
    );

    // ──────────────────────────────────────────────────────────────
    // Revenue Trend (monthly for last 12 months or daily for shorter periods)
    // ──────────────────────────────────────────────────────────────
    const revenueTrend: { label: string; revenue: number; invoiced: number }[] =
      [];

    if (period === '12m') {
      // Monthly grouping
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = startOfMonth(subMonths(now, i - 1));
        const label = format(monthStart, 'MMM yy');

        const monthInvoices = allInvoices.filter((inv) => {
          const d = new Date(inv.createdAt);
          return d >= monthStart && d < monthEnd;
        });

        const revenue = monthInvoices
          .filter(
            (inv) =>
              inv.paymentStatus === 'PAID' || inv.status === 'PAID',
          )
          .reduce((sum, inv) => sum + inv.finalAmount, 0);

        const invoiced = monthInvoices.reduce(
          (sum, inv) => sum + inv.finalAmount,
          0,
        );

        revenueTrend.push({ label, revenue, invoiced });
      }
    } else {
      // Daily grouping for 7d / 30d / 90d
      const days =
        period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const groupEvery = period === '90d' ? 7 : 1; // group 90d by weeks

      if (period === '90d') {
        // Weekly grouping
        for (let i = 12; i >= 0; i--) {
          const weekStart = startOfDay(subDays(now, i * 7));
          const weekEnd = startOfDay(subDays(now, (i - 1) * 7));
          const label = `W${format(weekStart, 'dd/MM')}`;
          const weekInvoices = allInvoices.filter((inv) => {
            const d = new Date(inv.createdAt);
            return d >= weekStart && d < weekEnd;
          });
          const revenue = weekInvoices
            .filter(
              (inv) =>
                inv.paymentStatus === 'PAID' || inv.status === 'PAID',
            )
            .reduce((sum, inv) => sum + inv.finalAmount, 0);
          const invoiced = weekInvoices.reduce(
            (sum, inv) => sum + inv.finalAmount,
            0,
          );
          revenueTrend.push({ label, revenue, invoiced });
        }
      } else {
        for (let i = days - 1; i >= 0; i--) {
          const dayStart = startOfDay(subDays(now, i));
          const dayEnd = startOfDay(subDays(now, i - 1));
          const label = format(dayStart, 'dd MMM');
          const dayInvoices = allInvoices.filter((inv) => {
            const d = new Date(inv.createdAt);
            return d >= dayStart && d < dayEnd;
          });
          const revenue = dayInvoices
            .filter(
              (inv) =>
                inv.paymentStatus === 'PAID' || inv.status === 'PAID',
            )
            .reduce((sum, inv) => sum + inv.finalAmount, 0);
          const invoiced = dayInvoices.reduce(
            (sum, inv) => sum + inv.finalAmount,
            0,
          );
          revenueTrend.push({ label, revenue, invoiced });
        }
      }
    }

    // ──────────────────────────────────────────────────────────────
    // Quote Status Funnel
    // ──────────────────────────────────────────────────────────────
    const quoteStatusOrder = [
      'DRAFT',
      'SENT',
      'ACCEPTED',
      'CONVERTED',
      'REJECTED',
      'EXPIRED',
    ];
    const quoteFunnel = quoteStatusOrder.map((status) => ({
      status,
      count: allQuotes.filter((q) => q.status === status).length,
      value: allQuotes
        .filter((q) => q.status === status)
        .reduce((sum, q) => sum + q.finalAmount, 0),
    }));

    // ──────────────────────────────────────────────────────────────
    // Invoice Payment Status
    // ──────────────────────────────────────────────────────────────
    const invoicePaymentStatus = [
      'PENDING',
      'PARTIAL',
      'PAID',
      'OVERDUE',
    ].map((ps) => ({
      status: ps,
      count: allInvoices.filter((inv) => inv.paymentStatus === ps).length,
      amount: allInvoices
        .filter((inv) => inv.paymentStatus === ps)
        .reduce((sum, inv) => sum + inv.finalAmount, 0),
    }));

    // ──────────────────────────────────────────────────────────────
    // Order Pipeline
    // ──────────────────────────────────────────────────────────────
    const orderStatusOrder = [
      'PENDING_PLANNING',
      'IN_PRODUCTION',
      'QC_TESTING',
      'PACKAGING',
      'READY_FOR_DISPATCH',
      'DISPATCHED',
      'DELIVERED',
      'CANCELLED',
    ];
    const orderPipeline = orderStatusOrder.map((status) => ({
      status,
      count: allOrders.filter((o) => o.status === status).length,
    }));

    // ──────────────────────────────────────────────────────────────
    // Top Customers
    // ──────────────────────────────────────────────────────────────
    const topCustomers = allCustomers
      .map((c) => {
        const totalRevenue = c.invoices
          .filter(() => true)
          .reduce((sum, inv) => sum + inv.finalAmount, 0);
        const lastOrderDate =
          c.orders.length > 0
            ? c.orders.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )[0].createdAt
            : null;
        return {
          id: c.id,
          name: c.name,
          quoteCount: c.quotes.length,
          orderCount: c.orders.length,
          totalRevenue,
          lastOrderDate,
        };
      })
      .filter((c) => c.totalRevenue > 0 || c.quoteCount > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // ──────────────────────────────────────────────────────────────
    // Recent Quotes (already fetched)
    // ──────────────────────────────────────────────────────────────
    const formattedRecentQuotes = recentQuotes.map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      customerName: q.customer.name,
      customerId: q.customer.id,
      amount: q.finalAmount,
      status: q.status,
      productName: q.lineItems[0]?.storeItem?.name || '—',
      createdAt: q.createdAt,
    }));

    return NextResponse.json({
      period,
      kpis: {
        totalRevenue,
        totalPaidAmount,
        outstandingReceivables,
        totalQuotes,
        quoteConversionRate,
        totalOrders,
        activeOrders,
        totalInvoiceValue,
      },
      revenueTrend,
      quoteFunnel,
      invoicePaymentStatus,
      orderPipeline,
      topCustomers,
      recentQuotes: formattedRecentQuotes,
    });
  } catch (error) {
    console.error('Error fetching sales overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales overview data' },
      { status: 500 },
    );
  }
}
