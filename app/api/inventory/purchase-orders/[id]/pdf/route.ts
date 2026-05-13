import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
      },
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 },
      );
    }

    // Dynamic import for jsPDF (server-side)
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();
    const items = purchaseOrder.items as any[];
    const supplier = purchaseOrder.supplier;

    // Colors
    const primaryColor: [number, number, number] = [15, 23, 42]; // #0F172A
    const accentColor: [number, number, number] = [100, 116, 139]; // #64748B

    // === Header ===
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SUPPLIER INVOICE', 15, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`PO Number: ${purchaseOrder.poNumber}`, 15, 32);
    doc.text(
      `Date: ${purchaseOrder.invoiceDate ? new Date(purchaseOrder.invoiceDate).toLocaleDateString() : new Date().toLocaleDateString()}`,
      15,
      38,
    );

    // Company name on top-right
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Greenage Technologies', 195, 22, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Manufacturing Division', 195, 30, { align: 'right' });

    // === Supplier Info ===
    doc.setTextColor(...primaryColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('SUPPLIER', 15, 58);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...accentColor);
    doc.text(supplier.name, 15, 65);
    if (supplier.contactPerson)
      doc.text(`Attn: ${supplier.contactPerson}`, 15, 71);
    if (supplier.phone) doc.text(`Phone: ${supplier.phone}`, 15, 77);
    if (supplier.email) doc.text(`Email: ${supplier.email}`, 15, 83);
    if (supplier.address) doc.text(`Address: ${supplier.address}`, 15, 89);

    // === Items Table ===
    const tableData = items.map((item: any, index: number) => [
      index + 1,
      item.materialName || item.partNumber,
      item.partNumber,
      item.unit,
      item.quantity,
      `₦${(item.unitCost || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      `₦${(item.totalCost || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
    ]);

    autoTable(doc, {
      startY: 98,
      head: [
        ['#', 'Material', 'Part No.', 'Unit', 'Qty', 'Unit Cost', 'Total'],
      ],
      body: tableData,
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 30, halign: 'right' },
        6: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: 15, right: 15 },
      theme: 'grid',
    });

    // === Totals ===
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    const totalsX = 130;
    doc.setFontSize(10);
    doc.setTextColor(...accentColor);

    doc.text('Subtotal:', totalsX, finalY);
    doc.setTextColor(...primaryColor);
    doc.text(
      `₦${purchaseOrder.subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      195,
      finalY,
      { align: 'right' },
    );

    if (purchaseOrder.tax > 0) {
      doc.setTextColor(...accentColor);
      doc.text('Tax:', totalsX, finalY + 7);
      doc.setTextColor(...primaryColor);
      doc.text(
        `₦${purchaseOrder.tax.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        195,
        finalY + 7,
        { align: 'right' },
      );
    }

    if (purchaseOrder.discount > 0) {
      doc.setTextColor(...accentColor);
      doc.text('Discount:', totalsX, finalY + 14);
      doc.setTextColor(...primaryColor);
      doc.text(
        `-₦${purchaseOrder.discount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        195,
        finalY + 14,
        { align: 'right' },
      );
    }

    const totalY =
      finalY +
      (purchaseOrder.tax > 0 ? 7 : 0) +
      (purchaseOrder.discount > 0 ? 7 : 0) +
      7;

    // Total line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(totalsX, totalY - 3, 195, totalY - 3);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('TOTAL:', totalsX, totalY + 3);
    doc.text(
      `₦${purchaseOrder.totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      195,
      totalY + 3,
      { align: 'right' },
    );

    // === Notes ===
    if (purchaseOrder.notes || purchaseOrder.invoiceNotes) {
      const notesY = totalY + 18;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Notes:', 15, notesY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...accentColor);
      const noteText = purchaseOrder.invoiceNotes || purchaseOrder.notes || '';
      doc.text(noteText, 15, notesY + 7, { maxWidth: 180 });
    }

    // === Footer ===
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 20, 210, 20, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...accentColor);
    // doc.text('Generated by Greenage Production Manager', 105, pageHeight - 10, {
    //   align: 'center',
    // });

    // Return PDF as buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${purchaseOrder.poNumber}-invoice.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 },
    );
  }
}
