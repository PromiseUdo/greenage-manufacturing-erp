import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// ── GET — list all archives (newest first, optional ?period= filter) ──────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const period = req.nextUrl.searchParams.get('period') ?? undefined;
    const limitParam = req.nextUrl.searchParams.get('limit');
    const take = limitParam ? Math.min(Number(limitParam), 100) : 50;

    const archives = await prisma.investorReportArchive.findMany({
      where: period ? { period } : undefined,
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        period: true,
        periodLabel: true,
        title: true,
        revenue: true,
        profit: true,
        productionVolume: true,
        inventoryValue: true,
        lastSentTo: true,
        lastSentAt: true,
        sendCount: true,
        archivedBy: true,
        generatedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ archives });
  } catch (error) {
    console.error('[investor archives GET]', error);
    return NextResponse.json(
      { error: 'Failed to load archives' },
      { status: 500 },
    );
  }
}

// ── POST — create a new archive snapshot ─────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const {
      period,
      periodLabel,
      title,
      generatedAt,
      revenue,
      profit,
      productionVolume,
      inventoryValue,
      profitMargin,
      collectionRate,
      yieldRate,
      reworkRate,
      lowStockCount,
      outOfStockCount,
      topProducts,
      topCustomers,
      receivablesAging,
      executiveSummary,
      financialNarrative,
      operationalNarrative,
      salesGrowthNarrative,
      strategyPipeline,
      marketOpportunity,
      riskMitigation,
      outlookForecast,
    } = body;

    if (!period || !periodLabel) {
      return NextResponse.json(
        { error: 'period and periodLabel are required' },
        { status: 400 },
      );
    }

    const archivedBy =
      (session.user as any)?.name ??
      (session.user as any)?.email ??
      'Unknown';

    const archive = await prisma.investorReportArchive.create({
      data: {
        period,
        periodLabel,
        title: title ?? null,
        generatedAt: generatedAt ?? null,
        revenue: revenue != null ? Number(revenue) : null,
        profit: profit != null ? Number(profit) : null,
        productionVolume:
          productionVolume != null ? Number(productionVolume) : null,
        inventoryValue: inventoryValue != null ? Number(inventoryValue) : null,
        profitMargin: profitMargin != null ? Number(profitMargin) : null,
        collectionRate: collectionRate != null ? Number(collectionRate) : null,
        yieldRate: yieldRate != null ? Number(yieldRate) : null,
        reworkRate: reworkRate != null ? Number(reworkRate) : null,
        lowStockCount: lowStockCount != null ? Number(lowStockCount) : null,
        outOfStockCount:
          outOfStockCount != null ? Number(outOfStockCount) : null,
        topProducts: topProducts ?? [],
        topCustomers: topCustomers ?? [],
        receivablesAging: receivablesAging ?? [],
        executiveSummary: executiveSummary ?? null,
        financialNarrative: financialNarrative ?? null,
        operationalNarrative: operationalNarrative ?? null,
        salesGrowthNarrative: salesGrowthNarrative ?? null,
        strategyPipeline: strategyPipeline ?? null,
        marketOpportunity: marketOpportunity ?? null,
        riskMitigation: riskMitigation ?? null,
        outlookForecast: outlookForecast ?? null,
        archivedBy,
        lastSentTo: [],
        sendCount: 0,
      },
    });

    return NextResponse.json({ archive }, { status: 201 });
  } catch (error) {
    console.error('[investor archives POST]', error);
    return NextResponse.json(
      { error: 'Failed to create archive' },
      { status: 500 },
    );
  }
}
