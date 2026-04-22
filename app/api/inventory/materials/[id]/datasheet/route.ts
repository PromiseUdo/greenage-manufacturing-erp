import { NextRequest, NextResponse } from 'next/server';
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

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        supplier: true,
        batches: {
          include: { grn: { select: { grnNumber: true } } },
          orderBy: { receivedDate: 'desc' },
          take: 20,
        },
        issuances: {
          orderBy: { issuedAt: 'desc' },
          take: 20,
        },
        _count: { select: { batches: true, issuances: true } },
      },
    });

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    const totalIn = await prisma.materialBatch.aggregate({
      where: { materialId: id },
      _sum: { quantity: true },
    });
    const totalOut = await prisma.materialIssuance.aggregate({
      where: { materialId: id },
      _sum: { quantity: true },
    });

    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();

    const primary: [number, number, number] = [15, 23, 42];
    const accent: [number, number, number] = [100, 116, 139];
    const green: [number, number, number] = [22, 163, 74];
    const red: [number, number, number] = [220, 38, 38];
    const lightGray: [number, number, number] = [248, 250, 252];

    const isLowStock =
      material.currentStock > 0 &&
      material.currentStock <= material.reorderLevel;
    const isOutOfStock = material.currentStock === 0;

    // ── Header band ──
    doc.setFillColor(...primary);
    doc.rect(0, 0, 210, 44, 'F');
    doc.setFillColor(234, 88, 12);
    doc.rect(0, 41, 210, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RAW MATERIAL DATASHEET', 15, 20);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Part No: ${material.partNumber}`, 15, 29);
    doc.text(
      `Generated: ${new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`,
      15,
      36,
    );

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Greenage Technologies', 195, 20, { align: 'right' });
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Inventory Management', 195, 28, { align: 'right' });

    // ── Material name ──
    doc.setTextColor(...primary);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(material.name, 15, 58);

    const categoryLabel = material.category.replace(/_/g, ' ');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...accent);
    doc.text(categoryLabel, 15, 65);

    // Stock status badge (right of name)
    const stockLabel = isOutOfStock
      ? 'OUT OF STOCK'
      : isLowStock
        ? 'LOW STOCK'
        : 'IN STOCK';
    const badgeColor: [number, number, number] = isOutOfStock
      ? red
      : isLowStock
        ? [202, 138, 4]
        : green;
    doc.setFillColor(...badgeColor);
    doc.roundedRect(155, 52, 40, 9, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(stockLabel, 175, 58, { align: 'center' });

    // ── Section helper ──
    const drawSectionHeader = (label: string, y: number) => {
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y, 180, 7, 'F');
      doc.setTextColor(...primary);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(label, 18, y + 5);
    };

    const drawField = (
      label: string,
      value: string,
      x: number,
      y: number,
    ) => {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...accent);
      doc.text(label.toUpperCase(), x, y);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...primary);
      doc.text(value || '—', x, y + 6);
    };

    const formatCurrency = (n: number) =>
      new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
      }).format(n);

    // ── Basic Info ──
    let y = 73;
    drawSectionHeader('MATERIAL INFORMATION', y);
    y += 12;

    drawField('Part Number', material.partNumber, 15, y);
    drawField('Category', categoryLabel, 75, y);
    drawField('Unit of Measure', material.unit, 140, y);

    y += 16;
    drawField(
      'Supplier',
      material.supplier?.name || 'Not assigned',
      15,
      y,
    );
    drawField(
      'Supplier Contact',
      material.supplier?.contactPerson ||
        material.supplier?.phone ||
        '—',
      75,
      y,
    );
    drawField(
      'Date Added',
      new Date(material.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      140,
      y,
    );

    // ── Stock Levels ──
    y += 20;
    drawSectionHeader('STOCK LEVELS', y);
    y += 12;

    drawField(
      'Current Stock',
      `${material.currentStock} ${material.unit}`,
      15,
      y,
    );
    drawField(
      'Reorder Level',
      `${material.reorderLevel} ${material.unit}`,
      75,
      y,
    );
    drawField(
      'Max Stock Level',
      material.maxStockLevel
        ? `${material.maxStockLevel} ${material.unit}`
        : 'Not set',
      140,
      y,
    );

    y += 16;
    drawField(
      'Unit Cost',
      material.unitCost ? formatCurrency(material.unitCost) : 'Not set',
      15,
      y,
    );
    drawField(
      'Total Stock Value',
      material.unitCost
        ? formatCurrency(material.currentStock * material.unitCost)
        : '—',
      75,
      y,
    );

    // ── Movement Summary ──
    y += 20;
    drawSectionHeader('MOVEMENT SUMMARY', y);
    y += 12;

    const totalReceived = totalIn._sum.quantity ?? 0;
    const totalIssued = totalOut._sum.quantity ?? 0;

    drawField(
      'Total Received (all time)',
      `${totalReceived} ${material.unit}`,
      15,
      y,
    );
    drawField(
      'Total Issued (all time)',
      `${totalIssued} ${material.unit}`,
      75,
      y,
    );
    drawField(
      'Total GRN Batches',
      String(material._count.batches),
      140,
      y,
    );

    y += 16;
    drawField('Total Issuances', String(material._count.issuances), 15, y);

    // ── Recent Batches Table ──
    y += 18;
    drawSectionHeader('RECENT RECEIPTS (LAST 20)', y);
    y += 4;

    if (material.batches.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Batch No.', 'GRN Ref', 'Qty Received', 'Received Date']],
        body: material.batches.map((b) => [
          b.batchNumber,
          b.grn?.grnNumber || '—',
          `${b.quantity} ${material.unit}`,
          new Date(b.receivedDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
        ]),
        headStyles: {
          fillColor: primary,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
        },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: lightGray },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 45 },
          2: { cellWidth: 40, halign: 'center' },
          3: { cellWidth: 40, halign: 'center' },
        },
        margin: { left: 15, right: 15 },
        theme: 'grid',
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    } else {
      doc.setFontSize(8.5);
      doc.setTextColor(...accent);
      doc.text('No receipts recorded yet.', 15, y + 10);
      y += 18;
    }

    // ── Recent Issuances Table ──
    // Start a new page if too close to the bottom
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    drawSectionHeader('RECENT ISSUANCES (LAST 20)', y);
    y += 4;

    if (material.issuances.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Batch Ref', 'Issued To', 'Purpose', 'Qty', 'Date']],
        body: material.issuances.map((i) => [
          i.batchNumber,
          i.issuedTo,
          i.purpose || i.orderId || '—',
          `${i.quantity} ${material.unit}`,
          new Date(i.issuedAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
        ]),
        headStyles: {
          fillColor: primary,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
        },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: lightGray },
        columnStyles: {
          0: { cellWidth: 38 },
          1: { cellWidth: 40 },
          2: { cellWidth: 48 },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 29, halign: 'center' },
        },
        margin: { left: 15, right: 15 },
        theme: 'grid',
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    } else {
      doc.setFontSize(8.5);
      doc.setTextColor(...accent);
      doc.text('No issuances recorded yet.', 15, y + 10);
    }

    // ── Footer on all pages ──
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const ph = doc.internal.pageSize.height;
      doc.setFillColor(248, 250, 252);
      doc.rect(0, ph - 14, 210, 14, 'F');
      doc.setFontSize(7);
      doc.setTextColor(...accent);
      doc.text(
        `${material.partNumber}  ·  ${material.name}  ·  Page ${i} of ${pageCount}  ·  Generated ${new Date().toLocaleString('en-GB')}  ·  Greenage Technologies`,
        105,
        ph - 5,
        { align: 'center' },
      );
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const filename = `${material.partNumber.replace(/[^a-zA-Z0-9]/g, '-')}-datasheet.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating material datasheet:', error);
    return NextResponse.json(
      { error: 'Failed to generate datasheet' },
      { status: 500 },
    );
  }
}
