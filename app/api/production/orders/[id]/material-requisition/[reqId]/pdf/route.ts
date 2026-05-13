import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reqId: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId, reqId } = await params;

    const requisition = await prisma.productionMaterialRequisition.findUnique({
      where: { id: reqId },
      include: {
        requestedBy: { select: { name: true, email: true } },
        productionOrder: {
          select: {
            orderNumber: true,
            quantity: true,
            product: { select: { name: true, productNumber: true } },
          },
        },
        productionUnit: { select: { unitId: true, unitNumber: true } },
        items: {
          include: {
            material: {
              select: {
                name: true,
                partNumber: true,
                unit: true,
                category: true,
                unitCost: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!requisition) {
      return NextResponse.json(
        { error: 'Requisition not found' },
        { status: 404 },
      );
    }
    if (requisition.productionOrderId !== orderId) {
      return NextResponse.json(
        { error: 'Requisition does not belong to this order' },
        { status: 403 },
      );
    }

    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();

    const primaryColor: [number, number, number] = [15, 23, 42];
    const accentColor: [number, number, number] = [100, 116, 139];
    const greenColor: [number, number, number] = [22, 163, 74];
    const redColor: [number, number, number] = [220, 38, 38];

    const isReplacement = requisition.notes?.startsWith('[Replacement');
    const typeLabel = isReplacement
      ? 'REPLACEMENT REQUEST'
      : 'MATERIAL REQUISITION';
    const headerAccent: [number, number, number] = isReplacement
      ? redColor
      : greenColor;

    // === Header ===
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 48, 'F');

    doc.setFillColor(...headerAccent);
    doc.rect(0, 45, 210, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(typeLabel, 15, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ref: ${requisition.requisitionNumber}`, 15, 31);
    doc.text(
      `Date: ${new Date(requisition.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      15,
      38,
    );

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Greenage Technologies', 195, 22, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Manufacturing Division', 195, 30, { align: 'right' });

    // === Info block ===
    const infoY = 60;
    const col1X = 15;
    const col2X = 110;

    const drawInfoRow = (
      label: string,
      value: string,
      x: number,
      y: number,
    ) => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...accentColor);
      doc.text(label.toUpperCase(), x, y);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...primaryColor);
      doc.text(value || '—', x, y + 6);
    };

    drawInfoRow(
      'Production Order',
      requisition.productionOrder?.orderNumber ?? '—',
      col1X,
      infoY,
    );
    drawInfoRow(
      'Product',
      requisition.productionOrder
        ? `${requisition.productionOrder.product.name} (${requisition.productionOrder.product.productNumber})`
        : '—',
      col2X,
      infoY,
    );

    drawInfoRow(
      'Production Unit',
      requisition.productionUnit
        ? `${requisition.productionUnit.unitId}`
        : 'All Units',
      col1X,
      infoY + 18,
    );
    drawInfoRow(
      'Requested By',
      requisition.requestedBy?.name ?? '—',
      col2X,
      infoY + 18,
    );

    drawInfoRow(
      'Status',
      requisition.status.replace(/_/g, ' '),
      col1X,
      infoY + 36,
    );
    drawInfoRow(
      'Order Qty',
      `${requisition.productionOrder?.quantity ?? '—'} units`,
      col2X,
      infoY + 36,
    );

    if (requisition.notes) {
      const cleanNotes = requisition.notes.replace(/^\[.*?\]\s*/, '');
      if (cleanNotes) {
        drawInfoRow('Notes', cleanNotes, col1X, infoY + 54);
      }
    }

    // === Divider ===
    const tableStartY = infoY + 74;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(15, tableStartY - 6, 195, tableStartY - 6);

    // === Materials Table ===
    const tableRows = requisition.items.map((item, index) => {
      const statusLabel =
        item.status === 'ISSUED'
          ? 'Issued'
          : item.status === 'PARTIAL'
            ? 'Partial'
            : item.status === 'UNAVAILABLE'
              ? 'Unavailable'
              : 'Pending';

      return [
        index + 1,
        item.material.name,
        item.material.partNumber ?? '—',
        item.material.category?.replace(/_/g, ' ') ?? '—',
        `${item.quantityRequired} ${item.material.unit}`,
        item.quantityIssued != null
          ? `${item.quantityIssued} ${item.material.unit}`
          : '—',
        statusLabel,
      ];
    });

    autoTable(doc, {
      startY: tableStartY,
      head: [
        [
          '#',
          'Material',
          'Part No.',
          'Category',
          'Qty Required',
          'Qty Issued',
          'Status',
        ],
      ],
      body: tableRows,
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 48 },
        2: { cellWidth: 28 },
        3: { cellWidth: 28 },
        4: { cellWidth: 28, halign: 'center' },
        5: { cellWidth: 25, halign: 'center' },
        6: { cellWidth: 23, halign: 'center' },
      },
      margin: { left: 15, right: 15 },
      theme: 'grid',
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 6) {
          const status = requisition.items[data.row.index]?.status;
          const colors: Record<string, [number, number, number]> = {
            ISSUED: [220, 252, 231],
            PARTIAL: [254, 243, 199],
            UNAVAILABLE: [254, 226, 226],
            PENDING: [219, 234, 254],
          };
          const textColors: Record<string, [number, number, number]> = {
            ISSUED: [22, 101, 52],
            PARTIAL: [146, 64, 14],
            UNAVAILABLE: [153, 27, 27],
            PENDING: [30, 64, 175],
          };
          if (status && colors[status]) {
            doc.setFillColor(...colors[status]);
            doc.rect(
              data.cell.x + 1,
              data.cell.y + 1,
              data.cell.width - 2,
              data.cell.height - 2,
              'F',
            );
            doc.setTextColor(...textColors[status]);
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            const label = data.cell.raw as string;
            doc.text(
              label,
              data.cell.x + data.cell.width / 2,
              data.cell.y + data.cell.height / 2 + 1,
              { align: 'center' },
            );
          }
        }
      },
    });

    const afterTableY = (doc as any).lastAutoTable.finalY + 16;

    // === Summary row ===
    const totalItems = requisition.items.length;
    const issuedItems = requisition.items.filter(
      (i) => i.status === 'ISSUED',
    ).length;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...accentColor);
    doc.text(
      `${totalItems} item${totalItems !== 1 ? 's' : ''} requested  ·  ${issuedItems} issued`,
      15,
      afterTableY,
    );

    // === Signature block ===
    const sigY = afterTableY + 14;
    const sigBoxHeight = 38;
    const pageWidth = 210;
    const sigWidth = (pageWidth - 45) / 3;

    const sigLabels = ['Requested By', 'Received From Store', 'Approved By'];
    sigLabels.forEach((label, i) => {
      const x = 15 + i * (sigWidth + 7.5);
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.rect(x, sigY, sigWidth, sigBoxHeight);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...accentColor);
      doc.text(label.toUpperCase(), x + 4, sigY + 7);

      if (i === 0 && requisition.requestedBy?.name) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...primaryColor);
        doc.text(requisition.requestedBy.name, x + 4, sigY + 18);
      }

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...accentColor);
      doc.text('Signature: _______________', x + 4, sigY + 28);
      doc.text(`Date: ________________`, x + 4, sigY + 34);
    });

    // === Footer ===
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 18, 210, 18, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(...accentColor);
    doc.text(
      `${requisition.requisitionNumber}  ·  ${requisition.productionOrder?.orderNumber ?? '—'}  ·  Generated ${new Date().toLocaleString('en-GB')}  `,
      105,
      pageHeight - 7,
      { align: 'center' },
    );

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${requisition.requisitionNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating requisition PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 },
    );
  }
}
