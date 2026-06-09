import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import {
  generateInvestorPDF,
  InvestorReportData,
} from '@/lib/pdf/investor-report';

// ── GET — regenerate + stream the PDF for a stored archive ───────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const archive = await prisma.investorReportArchive.findUnique({
      where: { id },
    });

    if (!archive) {
      return NextResponse.json({ error: 'Archive not found' }, { status: 404 });
    }

    const reportData: InvestorReportData = {
      period: archive.period,
      periodLabel: archive.periodLabel,
      generatedAt: archive.generatedAt ?? archive.createdAt.toLocaleDateString('en-NG', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      revenue: archive.revenue ?? 0,
      profit: archive.profit ?? 0,
      productionVolume: archive.productionVolume ?? 0,
      inventoryValue: archive.inventoryValue ?? 0,
      profitMargin: archive.profitMargin ?? undefined,
      collectionRate: archive.collectionRate ?? undefined,
      yieldRate: archive.yieldRate ?? undefined,
      reworkRate: archive.reworkRate ?? undefined,
      lowStockCount: archive.lowStockCount ?? undefined,
      outOfStockCount: archive.outOfStockCount ?? undefined,
      topProducts: (archive.topProducts as any[]) ?? [],
      topCustomers: (archive.topCustomers as any[]) ?? [],
      receivablesAging: (archive.receivablesAging as any[]) ?? [],
      executiveSummary: archive.executiveSummary ?? undefined,
      financialNarrative: archive.financialNarrative ?? undefined,
      operationalNarrative: archive.operationalNarrative ?? undefined,
      salesGrowthNarrative: archive.salesGrowthNarrative ?? undefined,
      strategyPipeline: archive.strategyPipeline ?? undefined,
      marketOpportunity: archive.marketOpportunity ?? undefined,
      riskMitigation: archive.riskMitigation ?? undefined,
      outlookForecast: archive.outlookForecast ?? undefined,
    };

    const pdfBuffer = await generateInvestorPDF(reportData);

    const safeLabel = archive.periodLabel.replace(/\s+/g, '-');
    const safeDate = archive.createdAt.toISOString().slice(0, 10);
    const filename = `Greenage-Investor-Report-${safeLabel}-${safeDate}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error('[investor archive PDF GET/:id]', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 },
    );
  }
}
