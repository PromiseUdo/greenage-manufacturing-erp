import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateInvestorPDF, InvestorReportData } from '@/lib/pdf/investor-report';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: InvestorReportData = await req.json();

    if (!body.period) {
      return NextResponse.json({ error: 'period is required' }, { status: 400 });
    }

    const pdfBuffer = await generateInvestorPDF(body);

    const safeLabel = (body.periodLabel ?? body.period).replace(/\s+/g, '-');
    const filename  = `Greenage-Investor-Report-${safeLabel}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error('[investor report PDF]', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 },
    );
  }
}
