import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

function getStartDate(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case 'daily':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'quarterly':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'biannual':
      return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    case 'yearly':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return null; // alltime — no filter
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ department: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { department } = await params;

    // Only SUPERADMIN bypasses permission checks; all other roles require explicit grants
    const role = (session.user as any)?.role;
    if (role !== 'SUPERADMIN') {
      const permissions: string[] = (session.user as any)?.permissions ?? [];
      const requiredPermission = `reports:${department}`;
      if (!permissions.includes(requiredPermission)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const period = req.nextUrl.searchParams.get('period') || 'monthly';
    const startDate = getStartDate(period);
    const dateFilter = startDate ? { gte: startDate } : undefined;

    switch (department) {
      // ─── SALES ────────────────────────────────────────────────────────────────
      case 'sales': {
        const [
          totalOrders,
          ordersByStatus,
          totalQuotes,
          convertedQuotes,
          invoiceAgg,
          totalInvoices,
          paymentStatuses,
          quotesByStatus,
          topCustomersByRevenue,
          salesVolumeAgg,
          orderDetailsRaw,
        ] = await Promise.all([
          prisma.order.count({ where: { createdAt: dateFilter } }),
          prisma.order.groupBy({
            by: ['status'],
            _count: { _all: true },
            where: { createdAt: dateFilter },
          }),
          prisma.quote.count({ where: { createdAt: dateFilter } }),
          prisma.quote.count({
            where: { status: 'CONVERTED', createdAt: dateFilter },
          }),
          prisma.invoice.aggregate({
            _sum: { finalAmount: true, paidAmount: true, balanceAmount: true },
            where: { createdAt: dateFilter },
          }),
          prisma.invoice.count({ where: { createdAt: dateFilter } }),
          prisma.invoice.groupBy({
            by: ['paymentStatus'],
            _count: { _all: true },
            where: { createdAt: dateFilter },
          }),
          prisma.quote.groupBy({
            by: ['status'],
            _count: { _all: true },
            where: { createdAt: dateFilter },
          }),
          // Top 5 customers by total invoiced amount
          prisma.invoice.groupBy({
            by: ['customerId'],
            _sum: { finalAmount: true, paidAmount: true },
            _count: { _all: true },
            where: { createdAt: dateFilter },
            orderBy: { _sum: { finalAmount: 'desc' } },
            take: 5,
          }),
          // Total units sold across all orders in period
          prisma.orderLineItem.aggregate({
            _sum: { quantity: true },
            where: { order: { createdAt: dateFilter } },
          }),
          // Order detail rows for the detail table
          prisma.order.findMany({
            where: { createdAt: dateFilter },
            select: {
              orderNumber: true,
              createdAt: true,
              customer: { select: { name: true } },
              lineItems: {
                select: {
                  quantity: true,
                  unitPrice: true,
                  totalAmount: true,
                  product: { select: { name: true } },
                  storeItem: { select: { name: true } },
                },
              },
              invoices: {
                select: {
                  discountAmount: true,
                  finalAmount: true,
                },
                take: 1,
              },
            },
            orderBy: { createdAt: 'desc' },
          }),
        ]);

        const customerIds = topCustomersByRevenue.map((c) => c.customerId);
        const customers = await prisma.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true },
        });

        const totalRevenue = invoiceAgg._sum.finalAmount || 0;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const salesVolume = salesVolumeAgg._sum.quantity ?? 0;

        // Build order detail rows
        const orderDetails = orderDetailsRaw.map((o) => {
          const items = o.lineItems;
          const invoice = o.invoices[0] ?? null;
          const itemCount = items.length;
          const primary = items[0];

          const productName =
            itemCount === 1
              ? (primary?.storeItem?.name ?? primary?.product?.name ?? '—')
              : `${itemCount} items`;

          const totalQty = items.reduce(
            (sum, it) => sum + (it.quantity ?? 0),
            0,
          );
          const unitPrice = itemCount === 1 ? (primary?.unitPrice ?? null) : null;
          const discount = invoice?.discountAmount ?? 0;
          const netSales =
            invoice?.finalAmount ??
            items.reduce((sum, it) => sum + (it.totalAmount ?? 0), 0);

          return {
            date: o.createdAt,
            orderNumber: o.orderNumber,
            customer: o.customer?.name ?? '—',
            product: productName,
            itemCount,
            qty: totalQty,
            unitPrice,
            discount,
            netSales,
          };
        });

        return NextResponse.json({
          totalOrders,
          totalQuotes,
          totalInvoices,
          avgOrderValue,
          salesVolume,
          conversionRate:
            totalQuotes > 0
              ? ((convertedQuotes / totalQuotes) * 100).toFixed(1)
              : '0',
          totalRevenue,
          totalCollected: invoiceAgg._sum.paidAmount || 0,
          totalOutstanding: invoiceAgg._sum.balanceAmount || 0,
          ordersByStatus: ordersByStatus.map((s) => ({
            status: s.status,
            count: s._count._all,
          })),
          quotesByStatus: quotesByStatus.map((s) => ({
            status: s.status,
            count: s._count._all,
          })),
          paymentStatuses: paymentStatuses.map((s) => ({
            status: s.paymentStatus,
            count: s._count._all,
          })),
          topCustomers: topCustomersByRevenue.map((c) => ({
            name:
              customers.find((cu) => cu.id === c.customerId)?.name || 'Unknown',
            orders: c._count._all,
            revenue: c._sum.finalAmount || 0,
            collected: c._sum.paidAmount || 0,
          })),
          orderDetails,
        });
      }

      // ─── PRODUCTION ───────────────────────────────────────────────────────────
      case 'production': {
        const [
          totalOrders,
          ordersByStatus,
          unitsByStatus,
          yieldAgg,
          quantityAgg,
          totalUnits,
          reworkCount,
          qcOutcomes,
          failCategories,
          stageActivity,
          topProductsRaw,
          workOrdersRaw,
        ] = await Promise.all([
          prisma.productionOrder.count({ where: { createdAt: dateFilter } }),
          prisma.productionOrder.groupBy({
            by: ['status'],
            _count: { _all: true },
            where: { createdAt: dateFilter },
          }),
          prisma.productionUnit.groupBy({
            by: ['status'],
            _count: { _all: true },
            where: { createdAt: dateFilter },
          }),
          // Yield rate
          prisma.productionOrder.aggregate({
            _avg: { yieldRate: true },
            where: { createdAt: dateFilter, yieldRate: { not: null } },
          }),
          // Throughput totals across all orders in period
          prisma.productionOrder.aggregate({
            _sum: {
              quantityStarted: true,
              quantityPassed: true,
              quantityRejected: true,
              quantityPackaged: true,
            },
            where: { createdAt: dateFilter },
          }),
          prisma.productionUnit.count({ where: { createdAt: dateFilter } }),
          prisma.unitRework.count({ where: { createdAt: dateFilter } }),
          // QC entry outcomes from production workflow
          prisma.productionQCEntry.groupBy({
            by: ['outcome'],
            _count: { _all: true },
            where: { createdAt: dateFilter },
          }),
          // Failure categories (only where set)
          prisma.productionQCEntry.groupBy({
            by: ['failureCategory'],
            _count: { _all: true },
            where: {
              createdAt: dateFilter,
              failureCategory: { not: null },
            },
          }),
          // Stage-level activity breakdown
          prisma.productionStageEntry.groupBy({
            by: ['status'],
            _count: { _all: true },
            where: { createdAt: dateFilter },
          }),
          // Top 5 products — enriched with yield + quantity totals
          prisma.productionOrder.groupBy({
            by: ['productId'],
            _count: { _all: true },
            _sum: {
              quantityStarted: true,
              quantityPackaged: true,
              quantityRejected: true,
            },
            _avg: { yieldRate: true },
            where: { createdAt: dateFilter },
            orderBy: { _count: { productId: 'desc' } },
            take: 5,
          }),
          // Work-order detail rows for the detail table
          prisma.productionOrder.findMany({
            where: { createdAt: dateFilter },
            select: {
              orderNumber: true,
              quantity: true,
              status: true,
              scheduledStart: true,
              actualStart: true,
              actualEnd: true,
              product: { select: { name: true } },
              stages: {
                select: {
                  stageLabel: true,
                  status: true,
                  sortOrder: true,
                },
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { createdAt: 'desc' },
          }),
        ]);

        const productIds = topProductsRaw.map((p) => p.productId);
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        });

        const qSum = quantityAgg._sum;
        const totalStarted = qSum.quantityStarted || 0;
        const totalPassed  = qSum.quantityPassed  || 0;
        const totalRejected = qSum.quantityRejected || 0;
        const totalPackaged = qSum.quantityPackaged || 0;

        // Rework rate = reworked units / started units × 100
        const reworkRate =
          totalStarted > 0
            ? Number(((reworkCount / totalStarted) * 100).toFixed(1))
            : null;

        return NextResponse.json({
          totalOrders,
          totalUnits,
          reworkCount,
          reworkRate,
          totalStarted,
          totalPassed,
          totalRejected,
          totalPackaged,
          avgYieldRate: yieldAgg._avg.yieldRate
            ? Number(yieldAgg._avg.yieldRate.toFixed(1))
            : null,
          // Throughput funnel data for chart
          throughput: [
            { stage: 'Started',  count: totalStarted  },
            { stage: 'Passed QC', count: totalPassed  },
            { stage: 'Packaged', count: totalPackaged  },
            { stage: 'Rejected', count: totalRejected  },
          ],
          ordersByStatus: ordersByStatus.map((s) => ({
            status: s.status,
            count: s._count._all,
          })),
          unitsByStatus: unitsByStatus.map((s) => ({
            status: s.status,
            count: s._count._all,
          })),
          qcOutcomes: qcOutcomes.map((e) => ({
            outcome: e.outcome,
            count: e._count._all,
          })),
          failCategories: failCategories.map((f) => ({
            category: f.failureCategory || 'OTHER',
            count: f._count._all,
          })),
          stageActivity: stageActivity.map((s) => ({
            status: s.status,
            count: s._count._all,
          })),
          productionByProduct: topProductsRaw.map((p) => ({
            name:
              products.find((pr) => pr.id === p.productId)?.name || 'Unknown',
            orders: p._count._all,
            started: p._sum.quantityStarted || 0,
            packaged: p._sum.quantityPackaged || 0,
            rejected: p._sum.quantityRejected || 0,
            yieldRate:
              p._avg.yieldRate != null
                ? Number(p._avg.yieldRate.toFixed(1))
                : null,
          })),
          workOrderDetails: workOrdersRaw.map((o) => {
            const inProgress = o.stages.find((s) => s.status === 'IN_PROGRESS');
            const lastCompleted = [...o.stages]
              .reverse()
              .find((s) => s.status === 'COMPLETED');
            const currentStage =
              inProgress?.stageLabel ??
              lastCompleted?.stageLabel ??
              o.stages[0]?.stageLabel ??
              '—';
            return {
              orderNumber: o.orderNumber,
              product: o.product?.name ?? '—',
              volume: o.quantity,
              currentStage,
              status: o.status,
              startedAt: o.actualStart ?? o.scheduledStart,
              completedAt: o.actualEnd,
            };
          }),
        });
      }

      // ─── INVENTORY ────────────────────────────────────────────────────────────
      case 'inventory': {
        const periodDaysMap: Record<string, number> = {
          daily: 1,
          monthly: 30,
          quarterly: 90,
          biannual: 180,
          yearly: 365,
          alltime: 365,
        };
        const periodDays = periodDaysMap[period] ?? 30;

        const [
          materials,
          poStatuses,
          poAgg,
          issuanceCount,
          grnCount,
          topIssuancesRaw,
          topSuppliersRaw,
          allIssuancesRaw,
          allInflowsRaw,
        ] = await Promise.all([
          prisma.material.findMany({
            select: {
              id: true,
              name: true,
              currentStock: true,
              reorderLevel: true,
              maxStockLevel: true,
              unitCost: true,
              unit: true,
              category: true,
            },
          }),
          prisma.purchaseOrder.groupBy({
            by: ['status'],
            _count: { _all: true },
            _sum: { totalAmount: true },
            where: { createdAt: dateFilter },
          }),
          prisma.purchaseOrder.aggregate({
            _sum: { totalAmount: true, paidAmount: true },
            where: { createdAt: dateFilter },
          }),
          prisma.materialIssuance.count({
            where: { issuedAt: dateFilter },
          }),
          prisma.gRN.count({ where: { createdAt: dateFilter } }),
          // Top consumed materials by quantity issued in the period
          prisma.materialIssuance.groupBy({
            by: ['materialId'],
            _count: { _all: true },
            _sum: { quantity: true },
            where: { issuedAt: dateFilter },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 8,
          }),
          // Top suppliers by PO spend in the period
          prisma.purchaseOrder.groupBy({
            by: ['supplierId'],
            _sum: { totalAmount: true, paidAmount: true },
            _count: { _all: true },
            where: { createdAt: dateFilter },
            orderBy: { _sum: { totalAmount: 'desc' } },
            take: 5,
          }),
          // All material issuances (usage) per material for stock movement detail
          prisma.materialIssuance.groupBy({
            by: ['materialId'],
            _sum: { quantity: true },
            where: { issuedAt: dateFilter },
          }),
          // All material batch receipts (inflow) per material — covers both direct PO
          // receiving and GRN-linked receipts since both write to MaterialBatch
          prisma.materialBatch.groupBy({
            by: ['materialId'],
            _sum: { quantity: true },
            where: { receivedDate: dateFilter },
          }),
        ]);

        // ── Stock health buckets ──────────────────────────────────────────────
        const outOfStock = materials.filter((m) => m.currentStock === 0);
        const lowStock = materials.filter(
          (m) => m.currentStock > 0 && m.currentStock <= m.reorderLevel,
        );
        const healthyStock = materials.filter(
          (m) => m.currentStock > m.reorderLevel,
        );

        // ── Total value ───────────────────────────────────────────────────────
        const totalValue = materials.reduce(
          (sum, m) => sum + m.currentStock * (m.unitCost || 0),
          0,
        );

        // ── Value by category (more useful than count by category) ─────────
        const valueByCategoryMap = materials.reduce(
          (acc, m) => {
            const v = m.currentStock * (m.unitCost || 0);
            acc[m.category] = (acc[m.category] || 0) + v;
            return acc;
          },
          {} as Record<string, number>,
        );

        // ── Top consumed materials — resolve names ────────────────────────
        const issuanceMaterialIds = topIssuancesRaw.map((i) => i.materialId);
        const issuanceMaterials = await prisma.material.findMany({
          where: { id: { in: issuanceMaterialIds } },
          select: { id: true, name: true, unit: true },
        });

        // ── Top suppliers — resolve names ──────────────────────────────────
        const supplierIds = topSuppliersRaw
          .map((s) => s.supplierId)
          .filter((id): id is string => id !== null);
        const suppliers = await prisma.supplier.findMany({
          where: { id: { in: supplierIds } },
          select: { id: true, name: true },
        });

        const totalPOSpend = poAgg._sum.totalAmount || 0;
        const totalPOPaid  = poAgg._sum.paidAmount  || 0;

        // ── Stock movement detail — all materials ─────────────────────────
        const usageMap = new Map(
          allIssuancesRaw.map((r) => [r.materialId, r._sum.quantity ?? 0]),
        );
        const inflowMap = new Map(
          allInflowsRaw.map((r) => [r.materialId, r._sum.quantity ?? 0]),
        );

        const stockMovementDetail = materials
          .map((m) => {
            const usage  = usageMap.get(m.id)  ?? 0;
            const inflow = inflowMap.get(m.id) ?? 0;
            const closingStock  = m.currentStock;
            const openingStock  = Math.max(0, closingStock - inflow + usage);
            const dailyUsage    = usage / periodDays;
            const daysCover     = dailyUsage > 0 ? Math.round(closingStock / dailyUsage) : null;
            const stockStatus   =
              closingStock === 0
                ? 'Out of Stock'
                : closingStock <= m.reorderLevel
                  ? 'Low Stock'
                  : 'Healthy';
            return {
              name:         m.name,
              unit:         m.unit,
              reorderLevel: m.reorderLevel,
              openingStock,
              usage,
              inflow,
              closingStock,
              stockStatus,
              daysCover,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({
          // ── KPI figures ────────────────────────────────────────────────
          totalMaterials: materials.length,
          healthyCount: healthyStock.length,
          lowStockCount: lowStock.length,
          outOfStockCount: outOfStock.length,
          totalInventoryValue: totalValue,
          issuanceCount,
          grnCount,
          totalPOSpend,
          totalPOPaid,
          totalPOOutstanding: totalPOSpend - totalPOPaid,

          // ── Stock health donut ─────────────────────────────────────────
          stockHealth: [
            { status: 'Healthy',     count: healthyStock.length },
            { status: 'Low Stock',   count: lowStock.length },
            { status: 'Out of Stock', count: outOfStock.length },
          ],

          // ── Value by category (sorted descending) ─────────────────────
          valueByCategory: Object.entries(valueByCategoryMap)
            .map(([category, value]) => ({ category, value }))
            .sort((a, b) => b.value - a.value),

          // ── PO pipeline by status ──────────────────────────────────────
          poByStatus: poStatuses.map((s) => ({
            status: s.status,
            count: s._count._all,
            amount: s._sum.totalAmount || 0,
          })),

          // ── Low stock items (sorted: most critical first) ──────────────
          // Most critical = lowest (currentStock / reorderLevel) ratio
          lowStockItems: [...outOfStock, ...lowStock]
            .sort((a, b) => {
              const ratioA = a.reorderLevel > 0 ? a.currentStock / a.reorderLevel : 0;
              const ratioB = b.reorderLevel > 0 ? b.currentStock / b.reorderLevel : 0;
              return ratioA - ratioB;
            })
            .slice(0, 12)
            .map((m) => ({
              name: m.name,
              category: m.category,
              unit: m.unit,
              currentStock: m.currentStock,
              reorderLevel: m.reorderLevel,
              unitCost: m.unitCost || 0,
              stockPct:
                m.reorderLevel > 0
                  ? Math.round((m.currentStock / m.reorderLevel) * 100)
                  : 0,
            })),

          // ── Top consumed materials ─────────────────────────────────────
          topConsumed: topIssuancesRaw.map((r) => ({
            name:
              issuanceMaterials.find((m) => m.id === r.materialId)?.name ||
              'Unknown',
            unit:
              issuanceMaterials.find((m) => m.id === r.materialId)?.unit || '',
            issuances: r._count._all,
            quantityIssued: r._sum.quantity || 0,
          })),

          // ── Top suppliers ──────────────────────────────────────────────
          topSuppliers: topSuppliersRaw.map((s) => ({
            name:
              suppliers.find((sup) => sup.id === s.supplierId)?.name ||
              'Unknown',
            poCount: s._count._all,
            spend: s._sum.totalAmount || 0,
            paid: s._sum.paidAmount || 0,
          })),

          // ── Stock movement detail (all materials, period-scoped) ───────
          stockMovementDetail,
        });
      }

      // ─── FINANCE ──────────────────────────────────────────────────────────────
      case 'finance': {
        const [
          invoiceAgg,
          invoicesByStatus,
          paymentMethods,
          poSpend,
          invoicesForTrend,
          unpaidInvoices,
          topDebtorsRaw,
          totalInvoiceCount,
          salesUnitsAgg,
          lineItemsRaw,
          returnsRaw,
        ] = await Promise.all([
          prisma.invoice.aggregate({
            _sum: {
              finalAmount: true,
              paidAmount: true,
              balanceAmount: true,
              taxAmount: true,
              discountAmount: true,
            },
            where: { createdAt: dateFilter },
          }),
          prisma.invoice.groupBy({
            by: ['status'],
            _count: { _all: true },
            _sum: { finalAmount: true, paidAmount: true, balanceAmount: true },
            where: { createdAt: dateFilter },
          }),
          // NOTE: paymentDate filter — tracks cash received in period (may differ
          // from totalCollected which tracks cumulative payments on period-invoices)
          prisma.invoicePayment.groupBy({
            by: ['paymentMethod'],
            _count: { _all: true },
            _sum: { amount: true },
            where: { paymentDate: dateFilter },
          }),
          prisma.purchaseOrder.aggregate({
            _sum: { totalAmount: true, paidAmount: true },
            where: { createdAt: dateFilter },
          }),
          // Fetch invoices in period for monthly trend computation in JS
          prisma.invoice.findMany({
            where: { createdAt: dateFilter },
            select: { createdAt: true, finalAmount: true, paidAmount: true },
            orderBy: { createdAt: 'asc' },
          }),
          // Receivables aging — always current state, no period filter
          prisma.invoice.findMany({
            where: { balanceAmount: { gt: 0 }, status: { not: 'PAID' } },
            select: { dueDate: true, balanceAmount: true },
          }),
          // Top debtors by outstanding balance (all time, current state)
          prisma.invoice.groupBy({
            by: ['customerId'],
            _sum: { balanceAmount: true, finalAmount: true },
            _count: { _all: true },
            orderBy: { _sum: { balanceAmount: 'desc' } },
            take: 10,
          }),
          prisma.invoice.count({ where: { createdAt: dateFilter } }),
          // Total units sold — sum of all invoice line item quantities in period
          prisma.invoiceLineItem.aggregate({
            _sum: { quantity: true },
            where: { invoice: { createdAt: dateFilter } },
          }),
          // Line items for COGS / product profitability breakdown
          prisma.invoiceLineItem.findMany({
            where: { invoice: { createdAt: dateFilter } },
            select: {
              quantity: true,
              unitPrice: true,
              totalAmount: true,
              productId: true,
              product: { select: { name: true, costPrice: true } },
              storeItem: {
                select: { name: true, unitCostPrice: true, productId: true },
              },
              invoice: {
                select: {
                  createdAt: true,
                  discountAmount: true,
                  totalAmount: true, // gross line-item total — proration denominator
                },
              },
            },
          }),
          // Product returns received in the period
          prisma.productReturn.findMany({
            where: dateFilter ? { dateReceived: dateFilter } : {},
            select: { productId: true, quantity: true },
          }),
        ]);

        // ── Monthly revenue trend ─────────────────────────────────────────────
        const trendMap: Record<string, { invoiced: number; collected: number }> = {};
        for (const inv of invoicesForTrend) {
          const key = inv.createdAt.toISOString().slice(0, 7); // "2026-01"
          if (!trendMap[key]) trendMap[key] = { invoiced: 0, collected: 0 };
          trendMap[key].invoiced  += inv.finalAmount  || 0;
          trendMap[key].collected += inv.paidAmount   || 0;
        }
        const monthlyTrend = Object.entries(trendMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, v]) => ({
            month: new Date(month + '-01').toLocaleDateString('en-NG', {
              month: 'short',
              year: '2-digit',
            }),
            invoiced: v.invoiced,
            collected: v.collected,
          }));

        // ── Receivables aging ─────────────────────────────────────────────────
        const now = new Date();
        const aging = { current: 0, days1_30: 0, days31_60: 0, days60plus: 0 };
        for (const inv of unpaidInvoices) {
          const daysOverdue = Math.floor(
            (now.getTime() - new Date(inv.dueDate).getTime()) /
              (1000 * 60 * 60 * 24),
          );
          const balance = inv.balanceAmount || 0;
          if (daysOverdue <= 0)       aging.current   += balance;
          else if (daysOverdue <= 30) aging.days1_30  += balance;
          else if (daysOverdue <= 60) aging.days31_60 += balance;
          else                        aging.days60plus += balance;
        }
        const receivablesAging = [
          { label: 'Current',    value: aging.current,    days: 0  },
          { label: '1–30 Days',  value: aging.days1_30,   days: 15 },
          { label: '31–60 Days', value: aging.days31_60,  days: 45 },
          { label: '60+ Days',   value: aging.days60plus, days: 90 },
        ];

        // ── Top debtors — resolve names ───────────────────────────────────────
        const debtorIds = topDebtorsRaw
          .filter((d) => (d._sum.balanceAmount || 0) > 0)
          .slice(0, 5)
          .map((d) => d.customerId);
        const debtorCustomers = await prisma.customer.findMany({
          where: { id: { in: debtorIds } },
          select: { id: true, name: true },
        });
        const topDebtors = topDebtorsRaw
          .filter((d) => (d._sum.balanceAmount || 0) > 0)
          .slice(0, 5)
          .map((d) => ({
            name:
              debtorCustomers.find((c) => c.id === d.customerId)?.name ||
              'Unknown',
            invoiceCount: d._count._all,
            totalInvoiced: d._sum.finalAmount || 0,
            outstanding: d._sum.balanceAmount || 0,
          }));

        // ── P&L: product-level aggregation for COGS / profitability ───────────

        // Returns map: productId → total units returned in period
        const returnsMap = new Map<string, number>();
        for (const r of returnsRaw) {
          if (r.productId) {
            returnsMap.set(r.productId, (returnsMap.get(r.productId) ?? 0) + r.quantity);
          }
        }

        type ProdRow = {
          productId: string | null;
          product: string;
          unitPrice: number;
          unitCost: number;
          qty: number;
          grossRevenue: number;
          proratedDiscount: number;
          firstDate: Date;
        };
        const productMap = new Map<string, ProdRow>();

        for (const li of lineItemsRaw) {
          const productName =
            li.storeItem?.name ?? li.product?.name ?? 'Unknown';
          const unitCost =
            (li.storeItem?.unitCostPrice ?? li.product?.costPrice) ?? 0;
          const productId =
            li.productId ?? li.storeItem?.productId ?? null;

          // Prorated discount: (lineTotal / invoiceGross) × invoiceDiscount
          const invoiceGross = li.invoice.totalAmount || 0;
          const lineDiscount =
            invoiceGross > 0
              ? ((li.totalAmount ?? 0) / invoiceGross) *
                (li.invoice.discountAmount ?? 0)
              : 0;

          if (!productMap.has(productName)) {
            productMap.set(productName, {
              productId,
              product: productName,
              unitPrice: li.unitPrice ?? 0,
              unitCost,
              qty: 0,
              grossRevenue: 0,
              proratedDiscount: 0,
              firstDate: li.invoice.createdAt,
            });
          }

          const row = productMap.get(productName)!;
          row.qty               += li.quantity ?? 0;
          row.grossRevenue      += li.totalAmount ?? 0;
          row.proratedDiscount  += lineDiscount;
          if (li.invoice.createdAt < row.firstDate) {
            row.firstDate = li.invoice.createdAt;
          }
        }

        // Compute totals and build detail rows
        let totalCogs       = 0;
        let totalNetRevenue = 0;

        const productDetails = Array.from(productMap.values())
          .map((row) => {
            const returns    = row.productId ? (returnsMap.get(row.productId) ?? 0) : 0;
            const netRevenue = row.grossRevenue - row.proratedDiscount;
            const cogs       = row.unitCost * row.qty;
            const profitPerUnit = row.unitPrice - row.unitCost;

            totalCogs       += cogs;
            totalNetRevenue += netRevenue;

            return {
              date:         row.firstDate,
              product:      row.product,
              unitsSold:    row.qty,
              unitPrice:    row.unitPrice,
              discount:     row.proratedDiscount,
              returns,
              unitCost:     row.unitCost,
              netRevenue,
              cogs,
              profitPerUnit,
            };
          })
          .sort((a, b) => b.netRevenue - a.netRevenue);

        const totalInvoiced      = invoiceAgg._sum.finalAmount  || 0;
        const totalCollected     = invoiceAgg._sum.paidAmount   || 0;
        const totalPurchaseSpend = poSpend._sum.totalAmount     || 0;
        const totalPurchasePaid  = poSpend._sum.paidAmount      || 0;
        const salesUnits         = salesUnitsAgg._sum.quantity  ?? 0;
        const grossProfit        = totalInvoiced - totalCogs;
        const profitMargin       =
          totalInvoiced > 0
            ? Number(((grossProfit / totalInvoiced) * 100).toFixed(1))
            : null;

        return NextResponse.json({
          // ── KPI figures ───────────────────────────────────────────────────
          totalInvoiced,
          totalCollected,
          totalOutstanding: invoiceAgg._sum.balanceAmount || 0,
          totalTax: invoiceAgg._sum.taxAmount    || 0,
          totalDiscount: invoiceAgg._sum.discountAmount || 0,
          totalInvoiceCount,
          avgInvoiceValue:
            totalInvoiceCount > 0 ? totalInvoiced / totalInvoiceCount : 0,
          collectionRate:
            totalInvoiced > 0
              ? ((totalCollected / totalInvoiced) * 100).toFixed(1)
              : '0',
          totalPurchaseSpend,
          totalPurchasePaid,
          totalPurchaseOutstanding: totalPurchaseSpend - totalPurchasePaid,

          // ── P&L KPIs ──────────────────────────────────────────────────────
          salesUnits,
          totalCogs:    Number(totalCogs.toFixed(2)),
          grossProfit:  Number(grossProfit.toFixed(2)),
          profitMargin,

          // ── Chart data ────────────────────────────────────────────────────
          monthlyTrend,
          receivablesAging,
          invoicesByStatus: invoicesByStatus.map((s) => ({
            status: s.status,
            count: s._count._all,
            amount: s._sum.finalAmount   || 0,
            paid:   s._sum.paidAmount    || 0,
            outstanding: s._sum.balanceAmount || 0,
          })),
          paymentMethods: paymentMethods.map((p) => ({
            method: p.paymentMethod || 'N/A',
            count: p._count._all,
            amount: p._sum.amount || 0,
          })),

          // ── Table data ────────────────────────────────────────────────────
          topDebtors,
          productDetails,
        });
      }

      // ─── QUALITY CONTROL ──────────────────────────────────────────────────────
      case 'quality-control': {
        const [
          qcResults,
          testTypes,
          ncrStatuses,
          totalQC,
          totalNCR,
          prodQCOutcomes,
          failCategories,
        ] = await Promise.all([
          prisma.qualityControl.groupBy({
            by: ['result'],
            _count: { _all: true },
            where: { testedAt: dateFilter },
          }),
          prisma.qualityControl.groupBy({
            by: ['testType'],
            _count: { _all: true },
            where: { testedAt: dateFilter },
          }),
          prisma.nCR.groupBy({
            by: ['status'],
            _count: { _all: true },
            where: { createdAt: dateFilter },
          }),
          prisma.qualityControl.count({ where: { testedAt: dateFilter } }),
          prisma.nCR.count({ where: { createdAt: dateFilter } }),
          prisma.productionQCEntry.groupBy({
            by: ['outcome'],
            _count: { _all: true },
            where: { createdAt: dateFilter },
          }),
          prisma.productionQCEntry.groupBy({
            by: ['failureCategory'],
            _count: { _all: true },
            where: {
              createdAt: dateFilter,
              failureCategory: { not: null },
            },
          }),
        ]);

        const passCount =
          qcResults.find((r) => r.result === 'PASS')?._count._all || 0;
        const failCount =
          qcResults.find((r) => r.result === 'FAIL')?._count._all || 0;
        const passRate =
          totalQC > 0 ? ((passCount / totalQC) * 100).toFixed(1) : '0';

        return NextResponse.json({
          totalQCTests: totalQC,
          totalNCRs: totalNCR,
          passCount,
          failCount,
          passRate,
          qcResults: qcResults.map((r) => ({
            result: r.result,
            count: r._count._all,
          })),
          testTypes: testTypes.map((t) => ({
            type: t.testType,
            count: t._count._all,
          })),
          ncrStatuses: ncrStatuses.map((s) => ({
            status: s.status,
            count: s._count._all,
          })),
          prodQCOutcomes: prodQCOutcomes.map((o) => ({
            outcome: o.outcome,
            count: o._count._all,
          })),
          failCategories: failCategories.map((f) => ({
            category: f.failureCategory || 'OTHER',
            count: f._count._all,
          })),
        });
      }

      // ─── DISPATCH / LOGISTICS ─────────────────────────────────────────────────
      case 'dispatch': {
        const [
          storeDispatchStatuses,
          returnStatuses,
          totalDispatches,
          totalReturns,
          deliveryMethods,
          returnsByProductRaw,
          returnAgg,
          storeDispatchByCustomerRaw,
          dispatchesForTrend,
        ] = await Promise.all([
          prisma.storeDispatch.groupBy({
            by: ['status'],
            _count: { _all: true },
            where: { createdAt: dateFilter },
          }),
          prisma.productReturn.groupBy({
            by: ['status'],
            _count: { _all: true },
            where: { createdAt: dateFilter },
          }),
          prisma.storeDispatch.count({ where: { createdAt: dateFilter } }),
          prisma.productReturn.count({ where: { createdAt: dateFilter } }),
          // Delivery method breakdown
          prisma.storeDispatch.groupBy({
            by: ['deliveryMethod'],
            _count: { _all: true },
            where: { createdAt: dateFilter },
          }),
          // Top returned products
          prisma.productReturn.groupBy({
            by: ['productId'],
            _count: { _all: true },
            _sum: { quantity: true },
            where: { createdAt: dateFilter },
            orderBy: { _count: { productId: 'desc' } },
            take: 5,
          }),
          // Return aggregates: units returned + repair cost
          prisma.productReturn.aggregate({
            _sum: { quantity: true, repairCost: true },
            where: { createdAt: dateFilter },
          }),
          // Top customers by dispatch volume
          prisma.storeDispatch.groupBy({
            by: ['customerId'],
            _count: { _all: true },
            where: { createdAt: dateFilter },
            orderBy: { _count: { customerId: 'desc' } },
            take: 5,
          }),
          // Dates for monthly trend
          prisma.storeDispatch.findMany({
            where: { createdAt: dateFilter },
            select: { createdAt: true },
            orderBy: { createdAt: 'asc' },
          }),
        ]);

        // ── Monthly dispatch trend ────────────────────────────────────────────
        const trendMap: Record<string, number> = {};
        for (const d of dispatchesForTrend) {
          const key = d.createdAt.toISOString().slice(0, 7);
          trendMap[key] = (trendMap[key] || 0) + 1;
        }
        const monthlyTrend = Object.entries(trendMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, count]) => ({
            month: new Date(month + '-01').toLocaleDateString('en-NG', {
              month: 'short',
              year: '2-digit',
            }),
            count,
          }));

        // ── Resolve product names for returns ────────────────────────────────
        const returnProductIds = returnsByProductRaw.map((r) => r.productId);
        const returnProducts = await prisma.product.findMany({
          where: { id: { in: returnProductIds } },
          select: { id: true, name: true },
        });

        // ── Resolve customer names ────────────────────────────────────────────
        const topCustomerIds = storeDispatchByCustomerRaw.map((c) => c.customerId);
        const topCustomers = await prisma.customer.findMany({
          where: { id: { in: topCustomerIds } },
          select: { id: true, name: true },
        });

        // ── KPI derivations ───────────────────────────────────────────────────
        const deliveredCount =
          storeDispatchStatuses.find((s) => s.status === 'DELIVERED')?._count._all || 0;
        const failedCount =
          storeDispatchStatuses.find((s) => s.status === 'FAILED_DELIVERY')?._count._all || 0;
        const deliveryRate =
          totalDispatches > 0
            ? ((deliveredCount / totalDispatches) * 100).toFixed(1)
            : '0';

        return NextResponse.json({
          // ── KPI figures ────────────────────────────────────────────────
          totalDispatches,
          totalStoreDispatches: totalDispatches,
          totalReturns,
          deliveredCount,
          failedCount,
          deliveryRate,
          totalUnitsReturned: returnAgg._sum.quantity || 0,
          totalRepairCost: returnAgg._sum.repairCost || 0,

          // ── Trend ──────────────────────────────────────────────────────
          monthlyTrend,

          // ── Chart data ─────────────────────────────────────────────────
          dispatchStatuses: storeDispatchStatuses.map((s) => ({
            status: s.status,
            count: s._count._all,
          })),
          storeDispatchStatuses: storeDispatchStatuses.map((s) => ({
            status: s.status,
            count: s._count._all,
          })),
          returnStatuses: returnStatuses.map((s) => ({
            status: s.status,
            count: s._count._all,
          })),
          deliveryMethods: deliveryMethods.map((m) => ({
            method: m.deliveryMethod || 'Not Specified',
            count: m._count._all,
          })),

          // ── Table data ─────────────────────────────────────────────────
          returnsByProduct: returnsByProductRaw.map((r) => ({
            name:
              returnProducts.find((p) => p.id === r.productId)?.name ||
              'Unknown',
            returns: r._count._all,
            quantity: r._sum.quantity || 0,
          })),
          topCustomers: storeDispatchByCustomerRaw.map((c) => ({
            name:
              topCustomers.find((cu) => cu.id === c.customerId)?.name ||
              'Unknown',
            dispatches: c._count._all,
          })),
        });
      }

      // ─── PROCUREMENT ──────────────────────────────────────────────────────────
      case 'procurement': {
        // Fetch all POs in the period with supplier + date fields
        const purchaseOrders = await prisma.purchaseOrder.findMany({
          where: { createdAt: dateFilter },
          select: {
            poNumber: true,
            status: true,
            totalAmount: true,
            paidAmount: true,
            items: true,
            createdAt: true,
            receivingEndDate: true,
            plannedEstimatedArrival: true,
            plannedReceivingEndDate: true,
            supplier: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        // ── Aggregate KPI figures ─────────────────────────────────────────────
        const [poByStatus, poAgg] = await Promise.all([
          prisma.purchaseOrder.groupBy({
            by: ['status'],
            _count: { _all: true },
            _sum: { totalAmount: true },
            where: { createdAt: dateFilter },
          }),
          prisma.purchaseOrder.aggregate({
            _sum: { totalAmount: true, paidAmount: true },
            where: { createdAt: dateFilter },
          }),
        ]);

        // ── JS-computed metrics (items is Json — no SQL aggregation) ──────────
        let totalQty = 0;
        let totalWeightedCost = 0;
        const leadTimeDays: number[] = [];
        let onTimeCount = 0;
        let deliveredCount = 0;

        // ── Monthly trend map ─────────────────────────────────────────────────
        const trendMap: Record<string, number> = {};

        // ── Supplier rollup ───────────────────────────────────────────────────
        const supplierMap: Record<
          string,
          { name: string; count: number; spend: number; onTime: number; delivered: number }
        > = {};

        // ── Detail rows ───────────────────────────────────────────────────────
        const poDetails = purchaseOrders.map((po) => {
          const items: any[] = Array.isArray(po.items) ? (po.items as any[]) : [];

          // Avg cost/unit accumulation
          for (const it of items) {
            const q = Number(it.quantity) || 0;
            const uc = Number(it.unitCost) || 0;
            totalQty += q;
            totalWeightedCost += q * uc;
          }

          // Monthly trend
          const key = po.createdAt.toISOString().slice(0, 7);
          trendMap[key] = (trendMap[key] || 0) + 1;

          // Lead time + on-time
          let leadTime: number | null = null;
          let onTime: boolean | null = null;
          if (po.receivingEndDate) {
            leadTime = Math.round(
              (po.receivingEndDate.getTime() - po.createdAt.getTime()) /
                (1000 * 60 * 60 * 24),
            );
            if (leadTime >= 0) leadTimeDays.push(leadTime);
            deliveredCount++;

            const expected = po.plannedEstimatedArrival ?? po.plannedReceivingEndDate;
            if (expected) {
              onTime = po.receivingEndDate <= expected;
              if (onTime) onTimeCount++;
            }
          }

          // Supplier rollup
          const supplierName = po.supplier?.name ?? 'Unknown';
          if (!supplierMap[supplierName]) {
            supplierMap[supplierName] = {
              name: supplierName,
              count: 0,
              spend: 0,
              onTime: 0,
              delivered: 0,
            };
          }
          supplierMap[supplierName].count++;
          supplierMap[supplierName].spend += po.totalAmount ?? 0;
          if (po.receivingEndDate) {
            supplierMap[supplierName].delivered++;
            if (onTime) supplierMap[supplierName].onTime++;
          }

          // Item summary for detail row
          const itemCount = items.length;
          const primaryItem = items[0];
          const rowQty = items.reduce(
            (s: number, it: any) => s + (Number(it.quantity) || 0),
            0,
          );
          const rowItem =
            itemCount === 1
              ? String(primaryItem?.materialName ?? '—')
              : `${itemCount} items`;
          const rowUnitCost = itemCount === 1 ? (Number(primaryItem?.unitCost) || null) : null;

          return {
            poNumber: po.poNumber,
            supplier: supplierName,
            item: rowItem,
            itemCount,
            qty: rowQty,
            unitCost: rowUnitCost,
            totalCost: po.totalAmount ?? 0,
            orderDate: po.createdAt,
            deliveryDate: po.receivingEndDate,
            leadTime,
            onTime,
            costVariance: (po.totalAmount ?? 0) - (po.paidAmount ?? 0),
            status: po.status,
          };
        });

        // ── Derived KPIs ─────────────────────────────────────────────────────
        const avgCostPerUnit =
          totalQty > 0 ? Number((totalWeightedCost / totalQty).toFixed(2)) : null;
        const avgLeadTime =
          leadTimeDays.length > 0
            ? Math.round(
                leadTimeDays.reduce((a, b) => a + b, 0) / leadTimeDays.length,
              )
            : null;
        const onTimeRate =
          deliveredCount > 0
            ? Number(((onTimeCount / deliveredCount) * 100).toFixed(1))
            : null;

        // ── Monthly trend ─────────────────────────────────────────────────────
        const monthlyTrend = Object.entries(trendMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, count]) => ({
            month: new Date(month + '-01').toLocaleDateString('en-NG', {
              month: 'short',
              year: '2-digit',
            }),
            count,
          }));

        // ── Top suppliers (sorted by spend desc, top 8) ───────────────────────
        const topSuppliers = Object.values(supplierMap)
          .sort((a, b) => b.spend - a.spend)
          .slice(0, 8)
          .map((s) => ({
            name: s.name,
            poCount: s.count,
            spend: s.spend,
            onTimeRate:
              s.delivered > 0
                ? Number(((s.onTime / s.delivered) * 100).toFixed(1))
                : null,
          }));

        return NextResponse.json({
          // ── KPIs ──────────────────────────────────────────────────────────
          totalPOs: purchaseOrders.length,
          totalSpend: poAgg._sum.totalAmount ?? 0,
          totalPaid: poAgg._sum.paidAmount ?? 0,
          totalOutstanding:
            (poAgg._sum.totalAmount ?? 0) - (poAgg._sum.paidAmount ?? 0),
          avgCostPerUnit,
          avgLeadTime,
          onTimeRate,
          onTimeCount,
          deliveredCount,

          // ── Chart data ─────────────────────────────────────────────────────
          poByStatus: poByStatus.map((s) => ({
            status: s.status,
            count: s._count._all,
            amount: s._sum.totalAmount ?? 0,
          })),
          monthlyTrend,
          topSuppliers,

          // ── Detail table ───────────────────────────────────────────────────
          poDetails,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Unknown department' },
          { status: 400 },
        );
    }
  } catch (err) {
    console.error('[reports API]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
