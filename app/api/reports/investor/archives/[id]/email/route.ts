import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import {
  generateInvestorPDF,
  InvestorReportData,
} from '@/lib/pdf/investor-report';

const resend = new Resend(process.env.RESEND_API_KEY!);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(raw: unknown, field: string): string[] {
  if (!raw) return [];
  if (!Array.isArray(raw))
    throw new Error(`${field} must be an array of email strings`);
  const invalid = (raw as string[]).filter((e) => !EMAIL_RE.test(e));
  if (invalid.length > 0)
    throw new Error(
      `Invalid email address(es) in ${field}: ${invalid.join(', ')}`,
    );
  return raw as string[];
}

// ── POST — resend an archived report to investors ────────────────────────────
export async function POST(
  req: NextRequest,
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

    const body = await req.json();
    const { to, cc, bcc, subject, message } = body as {
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      message?: string;
    };

    // ── Validate ──────────────────────────────────────────────────────────────
    let toList: string[];
    try {
      toList = parseEmails(to, 'to');
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }

    if (toList.length === 0) {
      return NextResponse.json(
        { error: 'At least one recipient is required' },
        { status: 422 },
      );
    }

    let ccList: string[] = [];
    let bccList: string[] = [];
    try {
      ccList = parseEmails(cc, 'cc');
      bccList = parseEmails(bcc, 'bcc');
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }

    if (!subject?.trim()) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 422 },
      );
    }

    // ── Rebuild report data from archive snapshot ─────────────────────────────
    const reportData: InvestorReportData = {
      period: archive.period,
      periodLabel: archive.periodLabel,
      generatedAt:
        archive.generatedAt ??
        archive.createdAt.toLocaleDateString('en-NG', {
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

    // ── Generate PDF ──────────────────────────────────────────────────────────
    const pdfBuffer = await generateInvestorPDF(reportData);
    const pdfBase64 = pdfBuffer.toString('base64');

    const safeLabel = archive.periodLabel.replace(/\s+/g, '-');
    const safeDate = archive.createdAt.toISOString().slice(0, 10);
    const filename = `Greenage-Investor-Report-${safeLabel}-${safeDate}.pdf`;

    // ── Build email HTML ──────────────────────────────────────────────────────
    const senderName =
      (session.user as any)?.name ?? 'Greenage Technologies';
    const htmlBody = buildEmailHtml({
      periodLabel: archive.periodLabel,
      generatedAt: reportData.generatedAt,
      revenue: archive.revenue ?? 0,
      profit: archive.profit ?? 0,
      productionVolume: archive.productionVolume ?? 0,
      inventoryValue: archive.inventoryValue ?? 0,
      customMessage: message ?? '',
      senderName,
      isResend: archive.sendCount > 0,
      originalDate: archive.createdAt.toLocaleDateString('en-NG', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    });

    // ── Send via Resend ───────────────────────────────────────────────────────
    const emailPayload: any = {
      from: process.env.EMAIL_FROM!,
      to: toList,
      subject: subject.trim(),
      html: htmlBody,
      attachments: [{ filename, content: pdfBase64 }],
    };
    if (ccList.length > 0) emailPayload.cc = ccList;
    if (bccList.length > 0) emailPayload.bcc = bccList;

    const result = await resend.emails.send(emailPayload);

    if (result.error) {
      console.error('[investor archive email] Resend error:', result.error);
      return NextResponse.json(
        { error: result.error.message ?? 'Email delivery failed' },
        { status: 502 },
      );
    }

    // ── Update send tracking on the archive ───────────────────────────────────
    await prisma.investorReportArchive.update({
      where: { id },
      data: {
        lastSentTo: toList,
        lastSentAt: new Date(),
        sendCount: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true, messageId: result.data?.id });
  } catch (error: any) {
    console.error('[investor archive email]', error);
    return NextResponse.json(
      { error: error.message ?? 'Unexpected server error' },
      { status: 500 },
    );
  }
}

// ── Email HTML template ───────────────────────────────────────────────────────
function buildEmailHtml(opts: {
  periodLabel: string;
  generatedAt: string;
  revenue: number;
  profit: number;
  productionVolume: number;
  inventoryValue: number;
  customMessage: string;
  senderName: string;
  isResend: boolean;
  originalDate: string;
}): string {
  function fmtN(n: number) {
    if (n >= 1_000_000) return `&#8358;${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `&#8358;${(n / 1_000).toFixed(1)}K`;
    return `&#8358;${n.toLocaleString()}`;
  }

  const rows = [
    ['Revenue', fmtN(opts.revenue)],
    ['Profit', fmtN(opts.profit)],
    ['Production Volume', `${opts.productionVolume.toLocaleString()} units`],
    ['Inventory Value', fmtN(opts.inventoryValue)],
  ];

  const tableRows = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#0f172a;">${label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;color:#1fa43b;font-weight:700;">${value}</td>
      </tr>`,
    )
    .join('');

  const customMsgHtml = opts.customMessage.trim()
    ? `<p style="margin:0 0 20px;color:#334155;line-height:1.6;">${opts.customMessage.replace(/\n/g, '<br/>')}</p>`
    : '';

  const resendBadge = opts.isResend
    ? `<p style="margin:0 0 16px;padding:8px 12px;background:#fef3c7;border-left:3px solid #f59e0b;color:#92400e;font-size:13px;border-radius:4px;">
        This is a re-sent copy of the archived report originally generated on <strong>${opts.originalDate}</strong>.
       </p>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:#003d34;padding:32px 36px;">
              <p style="margin:0 0 4px;color:#d3f2af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Greenage Technologies</p>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Company Investor Report</h1>
              <p style="margin:8px 0 0;color:#a7d9a0;font-size:13px;">Period: ${opts.periodLabel} &nbsp;·&nbsp; Generated: ${opts.generatedAt}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 36px;">
              ${resendBadge}
              ${customMsgHtml}
              <p style="margin:0 0 16px;color:#334155;line-height:1.6;">
                Please find attached the <strong>Greenage Technologies Investor Report</strong> for the <strong>${opts.periodLabel}</strong> period.
                The report includes a full overview of company performance, financial results, and strategic direction.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:24px;">
                <thead>
                  <tr style="background:#003d34;">
                    <th style="padding:10px 12px;text-align:left;color:#d3f2af;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;">KPI</th>
                    <th style="padding:10px 12px;text-align:right;color:#d3f2af;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;">Value</th>
                  </tr>
                </thead>
                <tbody>${tableRows}</tbody>
              </table>

              <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
                The full report with detailed analysis is attached as a PDF.
                Please reach out to <strong>${opts.senderName}</strong> if you have any questions.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#003d34;padding:20px 36px;text-align:center;">
              <p style="margin:0;color:#a7d9a0;font-size:11px;">
                &copy; ${new Date().getFullYear()} Greenage Technologies &nbsp;·&nbsp; This report is confidential.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
