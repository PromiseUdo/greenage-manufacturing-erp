import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

function getStartDate(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case 'daily':     return new Date(now.getTime() - 1  * 24 * 60 * 60 * 1000);
    case 'monthly':   return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'quarterly': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'biannual':  return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    case 'yearly':    return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:          return null;
  }
}

// ── GET — fetch live KPI data + existing draft for the period ─────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const period = req.nextUrl.searchParams.get('period') || 'quarterly';
    const startDate = getStartDate(period);
    const dateFilter = startDate ? { gte: startDate } : undefined;

    // ── Parallel live-data queries ───────────────────────────────────────────
    const [
      invoiceAgg,
      cogsAgg,
      productionAgg,
      materials,
      topCustomersRaw,
      topProductsRaw,
      collectionAgg,
      yieldAgg,
      reworkCount,
      productionTotal,
      lowStockMaterials,
      agingCurrent,
      aging30,
      aging60,
      agingOver60,
      draft,
    ] = await Promise.all([
      // Revenue
      prisma.invoice.aggregate({
        _sum: { finalAmount: true, paidAmount: true },
        where: { createdAt: dateFilter },
      }),
      // COGS — fetch line items with product/storeItem cost price for manual sum
      prisma.invoiceLineItem.findMany({
        where: { invoice: { createdAt: dateFilter } },
        select: {
          quantity: true,
          product:   { select: { costPrice: true } },
          storeItem: { select: { unitCostPrice: true } },
        },
      }),
      // Production volume (packaged units)
      prisma.productionOrder.aggregate({
        _sum: { quantityPackaged: true },
        where: { createdAt: dateFilter },
      }),
      // Inventory value
      prisma.material.findMany({
        select: { currentStock: true, unitCost: true },
      }),
      // Top customers by invoiced amount
      prisma.invoice.groupBy({
        by: ['customerId'],
        _sum: { finalAmount: true },
        where: { createdAt: dateFilter },
        orderBy: { _sum: { finalAmount: 'desc' } },
        take: 5,
      }),
      // Top products by net revenue
      prisma.invoiceLineItem.groupBy({
        by: ['productId'],
        _sum: { totalAmount: true, quantity: true },
        where: { invoice: { createdAt: dateFilter } },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 5,
      }),
      // Collection rate
      prisma.invoice.aggregate({
        _sum: { finalAmount: true, paidAmount: true },
        where: { createdAt: dateFilter },
      }),
      // Avg yield rate
      prisma.productionOrder.aggregate({
        _avg: { yieldRate: true },
        where: { createdAt: dateFilter },
      }),
      // Rework count
      prisma.unitRework.count({
        where: { createdAt: dateFilter },
      }),
      // Total production orders started
      prisma.productionOrder.count({
        where: { createdAt: dateFilter },
      }),
      // Low & out-of-stock
      prisma.material.findMany({
        select: { currentStock: true, reorderLevel: true },
      }),
      // Receivables aging — current (0-30 days)
      prisma.invoice.aggregate({
        _sum: { balanceAmount: true },
        where: {
          paymentStatus: { not: 'PAID' },
          createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
        },
      }),
      // 31–60 days
      prisma.invoice.aggregate({
        _sum: { balanceAmount: true },
        where: {
          paymentStatus: { not: 'PAID' },
          createdAt: {
            gte: new Date(Date.now() - 60 * 86400000),
            lt: new Date(Date.now() - 30 * 86400000),
          },
        },
      }),
      // 61–90 days
      prisma.invoice.aggregate({
        _sum: { balanceAmount: true },
        where: {
          paymentStatus: { not: 'PAID' },
          createdAt: {
            gte: new Date(Date.now() - 90 * 86400000),
            lt: new Date(Date.now() - 60 * 86400000),
          },
        },
      }),
      // 90+ days
      prisma.invoice.aggregate({
        _sum: { balanceAmount: true },
        where: {
          paymentStatus: { not: 'PAID' },
          createdAt: { lt: new Date(Date.now() - 90 * 86400000) },
        },
      }),
      // Existing draft for this period
      prisma.investorReportDraft.findFirst({
        where: { period },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    // ── Resolve customer names ────────────────────────────────────────────────
    const customerIds = topCustomersRaw
      .map((c) => c.customerId)
      .filter((id): id is string => id !== null);
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true },
    });

    // ── Resolve product names ─────────────────────────────────────────────────
    const productIds = topProductsRaw
      .map((p) => p.productId)
      .filter((id): id is string => id !== null);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    }).catch(() => [] as { id: string; name: string }[]);

    // ── Derived metrics ───────────────────────────────────────────────────────
    const revenue        = invoiceAgg._sum.finalAmount ?? 0;
    const totalCollected = collectionAgg._sum.paidAmount ?? 0;
    // COGS: sum of (unit cost × quantity) across all line items
    const cogsTotal = (cogsAgg as any[]).reduce((sum: number, li: any) => {
      const unitCost = (li.storeItem?.unitCostPrice ?? li.product?.costPrice) ?? 0;
      return sum + unitCost * (li.quantity ?? 0);
    }, 0);
    const profit        = revenue - cogsTotal;
    const profitMargin  = revenue > 0 ? (profit / revenue) * 100 : 0;
    const collectionRate = revenue > 0 ? (totalCollected / revenue) * 100 : 0;
    const productionVolume = productionAgg._sum.quantityPackaged ?? 0;
    const inventoryValue = materials.reduce(
      (s, m) => s + m.currentStock * (m.unitCost ?? 0),
      0,
    );
    const yieldRate  = yieldAgg._avg.yieldRate ?? 0;
    const reworkRate = productionTotal > 0 ? (reworkCount / productionTotal) * 100 : 0;

    const lowStockCount    = lowStockMaterials.filter(
      (m) => m.currentStock > 0 && m.currentStock <= m.reorderLevel,
    ).length;
    const outOfStockCount  = lowStockMaterials.filter(
      (m) => m.currentStock === 0,
    ).length;

    const receivablesAging = [
      { bucket: '0–30 days',  amount: agingCurrent._sum.balanceAmount ?? 0 },
      { bucket: '31–60 days', amount: aging30._sum.balanceAmount ?? 0 },
      { bucket: '61–90 days', amount: aging60._sum.balanceAmount ?? 0 },
      { bucket: '90+ days',   amount: agingOver60._sum.balanceAmount ?? 0 },
    ].filter((r) => r.amount > 0);

    const topCustomers = topCustomersRaw.map((c) => ({
      name:    customers.find((u) => u.id === c.customerId)?.name ?? 'Unknown',
      revenue: c._sum.finalAmount ?? 0,
    }));

    const topProducts = topProductsRaw.map((p) => ({
      name:    products.find((pr) => pr.id === p.productId)?.name ?? 'Unknown',
      revenue: p._sum.totalAmount ?? 0,
      units:   p._sum.quantity ?? 0,
    }));

    return NextResponse.json({
      liveData: {
        revenue,
        profit,
        profitMargin,
        collectionRate,
        productionVolume,
        inventoryValue,
        yieldRate,
        reworkRate,
        lowStockCount,
        outOfStockCount,
        receivablesAging,
        topCustomers,
        topProducts,
      },
      draft: draft ?? null,
    });
  } catch (error) {
    console.error('[investor report GET]', error);
    return NextResponse.json(
      { error: 'Failed to load investor report data' },
      { status: 500 },
    );
  }
}

// ── POST — upsert draft ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      period,
      revenue,
      profit,
      productionVolume,
      inventoryValue,
      executiveSummary,
      financialNarrative,
      operationalNarrative,
      salesGrowthNarrative,
      strategyPipeline,
      marketOpportunity,
      riskMitigation,
      outlookForecast,
    } = body;

    if (!period) {
      return NextResponse.json({ error: 'period is required' }, { status: 400 });
    }

    const userName = (session.user as any)?.name ?? (session.user as any)?.email ?? 'Unknown';

    // Find existing draft for this period (most recent)
    const existing = await prisma.investorReportDraft.findFirst({
      where: { period },
      orderBy: { updatedAt: 'desc' },
    });

    const data = {
      period,
      revenue:              revenue        != null ? Number(revenue)         : undefined,
      profit:               profit         != null ? Number(profit)          : undefined,
      productionVolume:     productionVolume != null ? Number(productionVolume) : undefined,
      inventoryValue:       inventoryValue != null ? Number(inventoryValue)  : undefined,
      executiveSummary:     executiveSummary     ?? undefined,
      financialNarrative:   financialNarrative   ?? undefined,
      operationalNarrative: operationalNarrative ?? undefined,
      salesGrowthNarrative: salesGrowthNarrative ?? undefined,
      strategyPipeline:     strategyPipeline     ?? undefined,
      marketOpportunity:    marketOpportunity    ?? undefined,
      riskMitigation:       riskMitigation       ?? undefined,
      outlookForecast:      outlookForecast      ?? undefined,
      lastEditedBy:  userName,
      lastEditedAt:  new Date(),
    };

    let saved;
    if (existing) {
      saved = await prisma.investorReportDraft.update({
        where: { id: existing.id },
        data,
      });
    } else {
      saved = await prisma.investorReportDraft.create({ data });
    }

    return NextResponse.json({ draft: saved });
  } catch (error) {
    console.error('[investor report POST]', error);
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
  }
}
