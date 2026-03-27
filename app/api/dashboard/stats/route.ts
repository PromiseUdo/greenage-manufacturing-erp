// app/api/dashboard/stats/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { startOfMonth, subMonths, format } from 'date-fns';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const last12MonthsStart = startOfMonth(subMonths(now, 11));
    const last30DaysStart = new Date(now);
    last30DaysStart.setDate(last30DaysStart.getDate() - 30);

    // ─────────────────────────────────────────────────────────────────────────
    // Fetch all data in parallel
    // ─────────────────────────────────────────────────────────────────────────
    const [
      allInvoices,
      allOrders,
      allQuotes,
      productionOrders,
      materials,
      returns,
      recentOrders,
      recentReturns,
      allCustomers,
      totalUsers,
      totalProducts,
    ] = await Promise.all([
      // Invoices for last 12 months
      prisma.invoice.findMany({
        where: { createdAt: { gte: last12MonthsStart } },
        select: {
          id: true,
          finalAmount: true,
          paidAmount: true,
          balanceAmount: true,
          paymentStatus: true,
          status: true,
          createdAt: true,
          customer: { select: { id: true, name: true } },
        },
      }),

      // All orders (no date filter — for pipeline)
      prisma.order.findMany({
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      }),

      // Quotes last 12 months
      prisma.quote.findMany({
        where: { createdAt: { gte: last12MonthsStart } },
        select: {
          id: true,
          status: true,
          finalAmount: true,
          createdAt: true,
        },
      }),

      // Production orders (all, for status + yield)
      prisma.productionOrder.findMany({
        select: {
          id: true,
          status: true,
          priority: true,
          quantity: true,
          quantityStarted: true,
          quantityPassed: true,
          quantityRejected: true,
          quantityPackaged: true,
          yieldRate: true,
          createdAt: true,
          product: { select: { id: true, name: true, category: true } },
        },
      }),

      // Materials for stock health
      prisma.material.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          partNumber: true,
          category: true,
          currentStock: true,
          reorderLevel: true,
          unitCost: true,
        },
      }),

      // Returns (all, for status counts)
      prisma.productReturn.findMany({
        select: {
          id: true,
          status: true,
          createdAt: true,
          product: { select: { name: true } },
          customer: { select: { name: true } },
        },
      }),

      // Recent 6 orders with details
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          createdAt: true,
          customer: { select: { name: true } },
          lineItems: {
            take: 1,
            select: { storeItem: { select: { name: true } } },
          },
        },
      }),

      // Recent 5 returns
      prisma.productReturn.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          returnNumber: true,
          status: true,
          createdAt: true,
          issueReported: true,
          product: { select: { name: true } },
          customer: { select: { name: true } },
        },
      }),

      // Top customers by invoice value (last 12 months)
      prisma.customer.findMany({
        select: {
          id: true,
          name: true,
          invoices: {
            where: { createdAt: { gte: last12MonthsStart } },
            select: { finalAmount: true, paidAmount: true },
          },
          orders: {
            where: { createdAt: { gte: last12MonthsStart } },
            select: { id: true },
          },
        },
      }),

      // Total users count
      prisma.user.count({ where: { isActive: true } }),

      // Total products count
      prisma.product.count({ where: { isActive: true } }),
    ]);

    // ─────────────────────────────────────────────────────────────────────────
    // Revenue KPIs
    // ─────────────────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────────────────
    // Orders & Quotes KPIs
    // ─────────────────────────────────────────────────────────────────────────
    const totalOrders = allOrders.length;
    const activeOrders = allOrders.filter(
      (o) =>
        o.status !== 'DELIVERED' &&
        o.status !== 'CANCELLED' &&
        o.status !== 'DISPATCHED',
    ).length;

    const totalQuotes = allQuotes.length;
    const convertedQuotes = allQuotes.filter(
      (q) => q.status === 'CONVERTED' || q.status === 'ACCEPTED',
    ).length;
    const quoteConversionRate =
      totalQuotes > 0
        ? Math.round((convertedQuotes / totalQuotes) * 100)
        : 0;

    // ─────────────────────────────────────────────────────────────────────────
    // Production KPIs
    // ─────────────────────────────────────────────────────────────────────────
    const activeProductionOrders = productionOrders.filter(
      (po) =>
        po.status === 'IN_PRODUCTION' ||
        po.status === 'PLANNED' ||
        po.status === 'QC',
    ).length;

    const ordersWithYield = productionOrders.filter(
      (po) => po.yieldRate !== null && po.yieldRate !== undefined,
    );
    const avgYieldRate =
      ordersWithYield.length > 0
        ? Math.round(
            ordersWithYield.reduce((sum, po) => sum + (po.yieldRate || 0), 0) /
              ordersWithYield.length,
          )
        : null;

    // Production status breakdown
    const productionStatusOrder = [
      'DRAFT',
      'PLANNED',
      'IN_PRODUCTION',
      'QC',
      'COMPLETED',
      'CANCELLED',
    ];
    const productionStatusBreakdown = productionStatusOrder.map((status) => ({
      status,
      count: productionOrders.filter((po) => po.status === status).length,
    }));

    // ─────────────────────────────────────────────────────────────────────────
    // Returns KPIs
    // ─────────────────────────────────────────────────────────────────────────
    const openReturns = returns.filter(
      (r) =>
        r.status !== 'COMPLETED' &&
        r.status !== 'CLOSED',
    ).length;

    const returnStatusBreakdown = [
      'RECEIVED',
      'EVALUATION',
      'RECOMMENDATION',
      'REPAIR',
      'IN_TRANSIT',
      'COMPLETED',
      'CLOSED',
    ].map((status) => ({
      status,
      count: returns.filter((r) => r.status === status).length,
    }));

    // ─────────────────────────────────────────────────────────────────────────
    // Inventory / Materials KPIs
    // ─────────────────────────────────────────────────────────────────────────
    const totalInventoryValue = materials.reduce(
      (sum, m) => sum + m.currentStock * (m.unitCost || 0),
      0,
    );
    const lowStockCount = materials.filter(
      (m) => m.currentStock > 0 && m.currentStock <= m.reorderLevel,
    ).length;
    const outOfStockCount = materials.filter(
      (m) => m.currentStock === 0,
    ).length;

    const lowStockAlerts = materials
      .filter((m) => m.currentStock <= m.reorderLevel)
      .sort((a, b) => a.currentStock - b.currentStock)
      .slice(0, 8)
      .map((m) => ({
        id: m.id,
        name: m.name,
        partNumber: m.partNumber,
        category: m.category,
        currentStock: m.currentStock,
        reorderLevel: m.reorderLevel,
        severity: m.currentStock === 0 ? 'critical' : 'warning',
      }));

    // Category breakdown for chart
    const categoryMap: Record<string, { count: number; value: number }> = {};
    materials.forEach((m) => {
      if (!categoryMap[m.category]) {
        categoryMap[m.category] = { count: 0, value: 0 };
      }
      categoryMap[m.category].count += 1;
      categoryMap[m.category].value += m.currentStock * (m.unitCost || 0);
    });
    const inventoryByCategory = Object.entries(categoryMap)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // ─────────────────────────────────────────────────────────────────────────
    // Revenue trend (last 12 months)
    // ─────────────────────────────────────────────────────────────────────────
    const revenueTrend = [];
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
          (inv) => inv.paymentStatus === 'PAID' || inv.status === 'PAID',
        )
        .reduce((sum, inv) => sum + inv.finalAmount, 0);

      const invoiced = monthInvoices.reduce(
        (sum, inv) => sum + inv.finalAmount,
        0,
      );

      revenueTrend.push({ label, revenue, invoiced });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Order pipeline
    // ─────────────────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────────────────
    // Top customers
    // ─────────────────────────────────────────────────────────────────────────
    const topCustomers = allCustomers
      .map((c) => ({
        id: c.id,
        name: c.name,
        orderCount: c.orders.length,
        totalRevenue: c.invoices.reduce((sum, inv) => sum + inv.finalAmount, 0),
        totalPaid: c.invoices.reduce(
          (sum, inv) => sum + (inv.paidAmount || 0),
          0,
        ),
      }))
      .filter((c) => c.totalRevenue > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // ─────────────────────────────────────────────────────────────────────────
    // Format recent orders & returns
    // ─────────────────────────────────────────────────────────────────────────
    const formattedRecentOrders = recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customer.name,
      productName: o.lineItems[0]?.storeItem?.name || '—',
      status: o.status,
      createdAt: o.createdAt,
    }));

    const formattedRecentReturns = recentReturns.map((r) => ({
      id: r.id,
      returnNumber: r.returnNumber,
      customerName: r.customer.name,
      productName: r.product.name,
      issueReported: r.issueReported,
      status: r.status,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({
      kpis: {
        totalRevenue: Math.round(totalRevenue),
        totalPaidAmount: Math.round(totalPaidAmount),
        outstandingReceivables: Math.round(outstandingReceivables),
        totalOrders,
        activeOrders,
        totalQuotes,
        quoteConversionRate,
        activeProductionOrders,
        avgYieldRate,
        openReturns,
        lowStockCount,
        outOfStockCount,
        totalInventoryValue: Math.round(totalInventoryValue),
        totalUsers,
        totalProducts,
      },
      revenueTrend,
      orderPipeline,
      productionStatusBreakdown,
      returnStatusBreakdown,
      inventoryByCategory,
      lowStockAlerts,
      topCustomers,
      recentOrders: formattedRecentOrders,
      recentReturns: formattedRecentReturns,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 },
    );
  }
}
