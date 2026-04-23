import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const params = await context.params;
  const { id } = params;

  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tool = await prisma.tool.findUnique({
      where: { id },
      include: {
        toolGroup: { select: { name: true, groupNumber: true } },
        lendings: {
          orderBy: { issuedAt: 'desc' },
          take: 20,
        },
        maintenanceHistory: {
          orderBy: { startDate: 'desc' },
          take: 20,
        },
        _count: { select: { lendings: true, maintenanceHistory: true } },
      },
    });

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();

    const logoPath = join(process.cwd(), 'public', 'greenage_logo_white.png');
    const logoBase64 = readFileSync(logoPath).toString('base64');
    const logoDataUrl = `data:image/png;base64,${logoBase64}`;

    // ── Brand colours ──
    const darkGreen: [number, number, number]  = [0, 61, 52];     // #003D34
    const brandGreen: [number, number, number] = [31, 164, 59];   // #1FA43B
    const mintGreen: [number, number, number]  = [211, 242, 175]; // #D3F2AF
    const black: [number, number, number]      = [0, 0, 0];
    const mutedLabel: [number, number, number] = [50, 100, 75];
    const lightMint: [number, number, number]  = [235, 250, 222];

    const statusColors: Record<string, [number, number, number]> = {
      AVAILABLE:         brandGreen,
      IN_USE:            [202, 138, 4],
      UNDER_MAINTENANCE: [37, 99, 235],
      RESERVED:          [147, 51, 234],
      DAMAGED:           [220, 38, 38],
      RETIRED:           [100, 116, 139],
    };
    const badgeColor: [number, number, number] =
      statusColors[tool.status] ?? ([100, 116, 139] as [number, number, number]);

    // ── Header band ──
    doc.setFillColor(...darkGreen);
    doc.rect(0, 0, 210, 44, 'F');
    doc.setFillColor(...brandGreen);
    doc.rect(0, 41, 210, 3, 'F');

    doc.setTextColor(...mintGreen);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('TOOL DATASHEET', 15, 20);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text(`Tool ID: ${tool.toolId}`, 15, 29);
    doc.text(
      `Generated: ${new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`,
      15,
      36,
    );

    doc.addImage(logoDataUrl, 'PNG', 160, 5, 35, 14);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mintGreen);
    doc.text('Inventory Management', 195, 26, { align: 'right' });

    // ── Tool name + status badge ──
    doc.setTextColor(...darkGreen);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(tool.name, 15, 58);

    const catLabel = tool.category.replace(/_/g, ' ');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedLabel);
    doc.text(catLabel, 15, 65);

    doc.setFillColor(...badgeColor);
    doc.roundedRect(148, 52, 47, 9, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(tool.status.replace(/_/g, ' '), 171.5, 58, { align: 'center' });

    // ── Helpers ──
    const drawSectionHeader = (label: string, y: number) => {
      doc.setFillColor(...mintGreen);
      doc.rect(15, y, 180, 7, 'F');
      doc.setFillColor(...brandGreen);
      doc.rect(15, y, 3, 7, 'F');
      doc.setTextColor(...darkGreen);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(label, 21, y + 5);
    };

    const drawField = (label: string, value: string, x: number, y: number) => {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...mutedLabel);
      doc.text(label.toUpperCase(), x, y);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...black);
      doc.text(value || '—', x, y + 6);
    };

    const formatCurrency = (n: number) =>
      'NGN ' +
      new Intl.NumberFormat('en-NG', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(n);

    // ── Tool Information ──
    let y = 73;
    drawSectionHeader('TOOL INFORMATION', y);
    y += 12;

    drawField('Tool ID', tool.toolId, 15, y);
    drawField('Category', catLabel, 75, y);
    drawField('Condition', tool.condition.replace(/_/g, ' '), 140, y);

    y += 16;
    drawField('Serial Number', tool.serialNumber || '—', 15, y);
    drawField('Manufacturer', tool.manufacturer || '—', 75, y);
    drawField('Location', tool.location || '—', 140, y);

    y += 16;
    if (tool.description) {
      drawField('Description', tool.description, 15, y);
      y += 16;
    }
    if (tool.toolGroup) {
      drawField(
        'Tool Group',
        `${tool.toolGroup.name} (${tool.toolGroup.groupNumber})`,
        15,
        y,
      );
      y += 16;
    }
    if (tool.currentHolder) {
      drawField('Current Holder', tool.currentHolder, 15, y);
      y += 16;
    }

    // ── Purchase Details ──
    drawSectionHeader('PURCHASE DETAILS', y);
    y += 12;

    drawField(
      'Purchase Date',
      tool.purchaseDate
        ? new Date(tool.purchaseDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '—',
      15,
      y,
    );
    drawField(
      'Purchase Cost',
      tool.purchaseCost ? formatCurrency(tool.purchaseCost) : '—',
      75,
      y,
    );
    drawField(
      'Date Added',
      new Date(tool.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      140,
      y,
    );

    // ── Usage Summary ──
    y += 20;
    drawSectionHeader('USAGE SUMMARY', y);
    y += 12;

    const totalReturned = tool.lendings.filter((l) => l.returnedAt).length;
    const currentlyOut = tool.lendings.filter((l) => l.status === 'ISSUED').length;

    drawField('Total Issuances', String(tool._count.lendings), 15, y);
    drawField('Times Returned', String(totalReturned), 75, y);
    drawField('Currently Out', String(currentlyOut), 140, y);

    y += 16;
    drawField('Maintenance Events', String(tool._count.maintenanceHistory), 15, y);
    if (tool.lastMaintenance) {
      drawField(
        'Last Maintenance',
        new Date(tool.lastMaintenance).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        75,
        y,
      );
    }
    if (tool.nextMaintenance) {
      drawField(
        'Next Maintenance',
        new Date(tool.nextMaintenance).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        140,
        y,
      );
    }

    // ── Lending History Table ──
    y += 20;
    drawSectionHeader('LENDING HISTORY (LAST 20)', y);
    y += 9;

    if (tool.lendings.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Issued To', 'Department', 'Purpose', 'Issued Date', 'Returned', 'Status']],
        body: tool.lendings.map((l) => [
          l.issuedTo,
          l.department || '—',
          l.purpose || l.projectName || '—',
          new Date(l.issuedAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          l.returnedAt
            ? new Date(l.returnedAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '—',
          l.status.replace(/_/g, ' '),
        ]),
        headStyles: {
          fillColor: darkGreen,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
        },
        bodyStyles: { fontSize: 8, textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: lightMint },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 28 },
          2: { cellWidth: 42 },
          3: { cellWidth: 28, halign: 'center' },
          4: { cellWidth: 28, halign: 'center' },
          5: { cellWidth: 19, halign: 'center' },
        },
        margin: { left: 15, right: 15 },
        theme: 'grid',
        tableLineColor: mintGreen,
        tableLineWidth: 0.3,
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    } else {
      doc.setFontSize(8.5);
      doc.setTextColor(...mutedLabel);
      doc.text('No lending records yet.', 15, y + 10);
      y += 18;
    }

    // ── Maintenance History Table ──
    if (y > 230) {
      doc.addPage();
      y = 25;
    }

    drawSectionHeader('MAINTENANCE HISTORY (LAST 20)', y);
    y += 9;

    if (tool.maintenanceHistory.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Type', 'Description', 'Performed By', 'Start Date', 'Completed', 'Cost']],
        body: tool.maintenanceHistory.map((m) => [
          m.maintenanceType.replace(/_/g, ' '),
          m.description || '—',
          m.performedBy,
          new Date(m.startDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          m.completedDate
            ? new Date(m.completedDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '—',
          m.cost ? formatCurrency(m.cost) : '—',
        ]),
        headStyles: {
          fillColor: darkGreen,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
        },
        bodyStyles: { fontSize: 8, textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: lightMint },
        columnStyles: {
          0: { cellWidth: 32 },
          1: { cellWidth: 45 },
          2: { cellWidth: 32 },
          3: { cellWidth: 26, halign: 'center' },
          4: { cellWidth: 26, halign: 'center' },
          5: { cellWidth: 19, halign: 'right' },
        },
        margin: { left: 15, right: 15 },
        theme: 'grid',
        tableLineColor: mintGreen,
        tableLineWidth: 0.3,
      });
    } else {
      doc.setFontSize(8.5);
      doc.setTextColor(...mutedLabel);
      doc.text('No maintenance records yet.', 15, y + 10);
    }

    // ── Footer on all pages ──
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const ph = doc.internal.pageSize.height;
      doc.setFillColor(...darkGreen);
      doc.rect(0, ph - 14, 210, 14, 'F');
      doc.setFillColor(...brandGreen);
      doc.rect(0, ph - 14, 3, 14, 'F');
      doc.setFontSize(7);
      doc.setTextColor(...mintGreen);
      doc.text(
        `${tool.toolId}  ·  ${tool.name}  ·  Page ${i} of ${pageCount}  ·  Generated ${new Date().toLocaleString('en-GB')}  ·  Greenage Technologies`,
        105,
        ph - 5,
        { align: 'center' },
      );
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const filename = `${tool.toolId.replace(/[^a-zA-Z0-9]/g, '-')}-datasheet.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating tool datasheet:', error);
    return NextResponse.json(
      { error: 'Failed to generate datasheet' },
      { status: 500 },
    );
  }
}
