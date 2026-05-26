/**
 * Server-side investor report PDF generator.
 * Uses jsPDF + jspdf-autotable with Roboto font loaded from the filesystem.
 * Returns a Buffer that can be streamed as application/pdf or base64-encoded
 * for Resend email attachments.
 */
import fs from 'fs';
import path from 'path';

export interface InvestorReportData {
  period: string;
  periodLabel: string;
  generatedAt: string;

  // KPIs
  revenue: number;
  profit: number;
  productionVolume: number;
  inventoryValue: number;

  // Live context data (auto-pulled, shown in PDF as supporting tables/notes)
  topProducts?: { name: string; revenue: number; units: number }[];
  topCustomers?: { name: string; revenue: number }[];
  profitMargin?: number;
  collectionRate?: number;
  yieldRate?: number;
  reworkRate?: number;
  lowStockCount?: number;
  outOfStockCount?: number;
  receivablesAging?: { bucket: string; amount: number }[];

  // Narrative sections
  executiveSummary?: string;
  financialNarrative?: string;
  operationalNarrative?: string;
  salesGrowthNarrative?: string;
  strategyPipeline?: string;
  marketOpportunity?: string;
  riskMitigation?: string;
  outlookForecast?: string;
}

function fmtNaira(n: number): string {
  if (n >= 1_000_000) return `N${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `N${(n / 1_000).toFixed(1)}K`;
  return `N${n.toLocaleString()}`;
}

function splitLines(doc: any, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text || '', maxWidth);
}

export async function generateInvestorPDF(
  data: InvestorReportData,
): Promise<Buffer> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const PW = 297; // A4 landscape width mm
  const ML = 14;  // margin left
  const MR = 14;  // margin right
  const CW = PW - ML - MR; // content width (269 mm)

  // ── Register Roboto from filesystem so ₦ renders ─────────────────────────
  const fontsDir = path.join(process.cwd(), 'public', 'fonts');
  try {
    const regular = fs.readFileSync(path.join(fontsDir, 'Roboto-Regular.ttf'));
    const bold    = fs.readFileSync(path.join(fontsDir, 'Roboto-Bold.ttf'));
    doc.addFileToVFS('Roboto-Regular.ttf', regular.toString('base64'));
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.addFileToVFS('Roboto-Bold.ttf', bold.toString('base64'));
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    doc.setFont('Roboto', 'normal');
  } catch {
    // Fallback to helvetica if font files are missing
    doc.setFont('helvetica', 'normal');
  }

  // ── Brand colours ─────────────────────────────────────────────────────────
  const DARK_GREEN: [number, number, number]   = [0, 61, 52];
  const MID_GREEN: [number, number, number]    = [31, 164, 59];
  const LIGHT_GREEN: [number, number, number]  = [211, 242, 175];
  const WHITE: [number, number, number]        = [255, 255, 255];
  const TEXT: [number, number, number]         = [15, 23, 42];
  const MUTED: [number, number, number]        = [100, 116, 139];

  // ── Cover / header ────────────────────────────────────────────────────────
  doc.setFillColor(...DARK_GREEN);
  doc.rect(0, 0, PW, 52, 'F');

  // Accent stripe
  doc.setFillColor(...MID_GREEN);
  doc.rect(0, 52, PW, 2, 'F');

  // Try logo
  try {
    const logoPath = path.join(process.cwd(), 'public', 'greenage_logo_white.png');
    const logoData = fs.readFileSync(logoPath).toString('base64');
    doc.addImage(logoData, 'PNG', ML, 10, 36, 12);
  } catch { /* no logo — skip */ }

  doc.setTextColor(...WHITE);
  doc.setFontSize(18);
  doc.setFont('Roboto', 'bold');
  doc.text('Company Investor Report', ML, 36);

  doc.setFontSize(9);
  doc.setFont('Roboto', 'normal');
  doc.setTextColor(...LIGHT_GREEN);
  doc.text(
    `Period: ${data.periodLabel}   ·   Generated: ${data.generatedAt}`,
    ML,
    44,
  );

  // Confidential badge top-right
  doc.setFontSize(7.5);
  doc.setFont('Roboto', 'bold');
  doc.setTextColor(...LIGHT_GREEN);
  doc.text('CONFIDENTIAL', PW - MR, 14, { align: 'right' });

  doc.setTextColor(...TEXT);
  let y = 62;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const pageH = 210; // A4 landscape height mm
  const bottomMargin = 20;

  function ensureSpace(needed: number) {
    if (y + needed > pageH - bottomMargin) {
      doc.addPage();
      y = 18;
    }
  }

  function sectionHeader(title: string) {
    ensureSpace(14);
    doc.setFillColor(...DARK_GREEN);
    doc.rect(ML, y, CW, 7.5, 'F');
    doc.setFontSize(10);
    doc.setFont('Roboto', 'bold');
    doc.setTextColor(...WHITE);
    doc.text(title.toUpperCase(), ML + 3, y + 5.2);
    doc.setTextColor(...TEXT);
    y += 12;
  }

  function bodyText(text: string | undefined, indent = 0) {
    if (!text?.trim()) {
      doc.setFontSize(9);
      doc.setFont('Roboto', 'normal');
      doc.setTextColor(...MUTED);
      ensureSpace(6);
      doc.text('(No content provided)', ML + indent, y);
      y += 6;
      doc.setTextColor(...TEXT);
      return;
    }
    const lines = splitLines(doc, text, CW - indent);
    doc.setFontSize(9);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(...TEXT);
    for (const line of lines) {
      ensureSpace(5.5);
      doc.text(line, ML + indent, y);
      y += 5.5;
    }
    y += 2;
  }

  function kpiRow(label: string, value: string) {
    ensureSpace(7);
    doc.setFontSize(9);
    doc.setFont('Roboto', 'bold');
    doc.setTextColor(...TEXT);
    doc.text(label, ML, y);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(MID_GREEN[0], MID_GREEN[1], MID_GREEN[2]);
    doc.text(value, ML + 60, y);
    doc.setTextColor(...TEXT);
    y += 6.5;
  }

  const sharedTableStyle = {
    theme: 'grid' as const,
    styles: { font: 'Roboto', fontStyle: 'normal' as const, fontSize: 8.5 },
    headStyles: {
      font: 'Roboto',
      fontStyle: 'bold' as const,
      fillColor: DARK_GREEN,
      textColor: WHITE,
    },
    alternateRowStyles: {
      fillColor: [240, 250, 240] as [number, number, number],
    },
  };

  // ── 1. Executive Summary ──────────────────────────────────────────────────
  sectionHeader('Executive Summary');
  bodyText(data.executiveSummary);
  y += 3;

  // ── 2. KPI Summary ────────────────────────────────────────────────────────
  sectionHeader('KPI Summary');
  autoTable(doc, {
    startY: y,
    head: [['KPI', 'Value']],
    body: [
      ['Revenue', fmtNaira(data.revenue)],
      ['Profit', fmtNaira(data.profit)],
      ['Production Volume', `${data.productionVolume.toLocaleString()} units`],
      ['Inventory Value', fmtNaira(data.inventoryValue)],
      ...(data.profitMargin != null
        ? [['Profit Margin', `${data.profitMargin.toFixed(1)}%`]]
        : []),
      ...(data.collectionRate != null
        ? [['Collection Rate', `${data.collectionRate.toFixed(1)}%`]]
        : []),
    ],
    ...sharedTableStyle,
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: CW - 70, halign: 'right' as const },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ── 3. Financial Performance ──────────────────────────────────────────────
  sectionHeader('Financial Performance');
  bodyText(data.financialNarrative);

  if (data.topProducts && data.topProducts.length > 0) {
    ensureSpace(30);
    doc.setFontSize(8.5);
    doc.setFont('Roboto', 'bold');
    doc.setTextColor(...MUTED);
    doc.text('TOP PRODUCTS BY REVENUE', ML, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['#', 'Product', 'Revenue', 'Units']],
      body: data.topProducts.slice(0, 5).map((p, i) => [
        i + 1,
        p.name,
        fmtNaira(p.revenue),
        p.units.toLocaleString(),
      ]),
      ...sharedTableStyle,
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: CW - 8 - 36 - 24 },
        2: { cellWidth: 36, halign: 'right' as const },
        3: { cellWidth: 24, halign: 'right' as const },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── 4. Operational Performance ────────────────────────────────────────────
  sectionHeader('Operational Performance');
  if (data.yieldRate != null || data.reworkRate != null) {
    ensureSpace(18);
    if (data.yieldRate != null) kpiRow('Yield Rate', `${data.yieldRate.toFixed(1)}%`);
    if (data.reworkRate != null) kpiRow('Rework Rate', `${data.reworkRate.toFixed(1)}%`);
    y += 2;
  }
  bodyText(data.operationalNarrative);

  // ── 5. Sales & Growth Drivers ─────────────────────────────────────────────
  sectionHeader('Sales & Growth Drivers');
  bodyText(data.salesGrowthNarrative);

  if (data.topCustomers && data.topCustomers.length > 0) {
    ensureSpace(30);
    doc.setFontSize(8.5);
    doc.setFont('Roboto', 'bold');
    doc.setTextColor(...MUTED);
    doc.text('TOP CUSTOMERS BY REVENUE', ML, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['#', 'Customer', 'Revenue']],
      body: data.topCustomers.slice(0, 5).map((c, i) => [
        i + 1,
        c.name,
        fmtNaira(c.revenue),
      ]),
      ...sharedTableStyle,
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: CW - 8 - 40 },
        2: { cellWidth: 40, halign: 'right' as const },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── 6. Strategic Projects Pipeline ────────────────────────────────────────
  sectionHeader('Strategic Projects Pipeline');
  bodyText(data.strategyPipeline);

  // ── 7. Market Opportunity ─────────────────────────────────────────────────
  sectionHeader('Market Opportunity');
  bodyText(data.marketOpportunity);

  // ── 8. Risk & Mitigation ──────────────────────────────────────────────────
  sectionHeader('Risk & Mitigation');

  if (
    (data.lowStockCount != null && data.lowStockCount > 0) ||
    (data.outOfStockCount != null && data.outOfStockCount > 0)
  ) {
    ensureSpace(14);
    if (data.lowStockCount != null)
      kpiRow('Low Stock Items', String(data.lowStockCount));
    if (data.outOfStockCount != null)
      kpiRow('Out-of-Stock Items', String(data.outOfStockCount));
    y += 2;
  }

  if (data.receivablesAging && data.receivablesAging.length > 0) {
    ensureSpace(30);
    doc.setFontSize(8.5);
    doc.setFont('Roboto', 'bold');
    doc.setTextColor(...MUTED);
    doc.text('RECEIVABLES AGEING', ML, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Bucket', 'Amount']],
      body: data.receivablesAging.map((r) => [r.bucket, fmtNaira(r.amount)]),
      ...sharedTableStyle,
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: CW - 80, halign: 'right' as const },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  bodyText(data.riskMitigation);

  // ── 9. Outlook & Forecast ─────────────────────────────────────────────────
  sectionHeader('Outlook & Forecast');
  bodyText(data.outlookForecast);

  // ── Footer on every page ──────────────────────────────────────────────────
  const pageCount = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...DARK_GREEN);
    doc.rect(0, pageH - 10, PW, 10, 'F');
    doc.setFontSize(7.5);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(...LIGHT_GREEN);
    doc.text('Greenage Technologies — Confidential', ML, pageH - 3.5);
    doc.text(`Page ${i} of ${pageCount}`, PW - MR, pageH - 3.5, { align: 'right' });
  }

  return Buffer.from(doc.output('arraybuffer'));
}
