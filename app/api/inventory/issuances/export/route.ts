import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'excel';
    const search = searchParams.get('search') || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { issuedBy: { contains: search, mode: 'insensitive' } },
        { material: { name: { contains: search, mode: 'insensitive' } } },
        { material: { partNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const issuances = await prisma.materialIssuance.findMany({
      where,
      include: {
        material: {
          select: {
            name: true,
            partNumber: true,
            unit: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    if (format === 'excel') {
      return exportToExcel(issuances);
    } else if (format === 'pdf') {
      return exportToPDF(issuances);
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Issuances export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function exportToExcel(issuances: any[]) {
  const data = issuances.map((i) => ({
    'Batch Number': i.batchNumber || '—',
    'Issue Date': new Date(i.issuedAt).toLocaleDateString(),
    Material: i.material?.name || '—',
    'Part Number': i.material?.partNumber || '—',
    Quantity: `${i.quantity} ${i.material?.unit || ''}`,
    'Issued By': i.issuedBy || '—',
    Department: i.issuedTo || '—',
    Purpose: i.purpose || '—',
    Notes: i.notes || '—',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  ws['!cols'] = [
    { wch: 18 }, // Batch
    { wch: 14 }, // Date
    { wch: 30 }, // Material
    { wch: 18 }, // Part#
    { wch: 16 }, // Quantity
    { wch: 20 }, // Issued By
    { wch: 18 }, // Department
    { wch: 30 }, // Purpose
    { wch: 40 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Issuances');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=issuances_${
        new Date().toISOString().split('T')[0]
      }.xlsx`,
    },
  });
}

function exportToPDF(issuances: any[]) {
  const doc = new jsPDF('landscape');

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Material Issuances Report', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

  const tableData = issuances.map((i) => [
    i.batchNumber || '—',
    new Date(i.issuedAt).toLocaleDateString(),
    i.material?.name || '—',
    i.material?.partNumber || '—',
    `${i.quantity} ${i.material?.unit || ''}`,
    i.issuedBy || '—',
    i.issuedTo || '—',
    i.purpose || '—',
  ]);

  autoTable(doc, {
    head: [
      [
        'Batch #',
        'Date',
        'Material',
        'Part #',
        'Quantity',
        'Issued By',
        'Department',
        'Purpose',
      ],
    ],
    body: tableData,
    startY: 28,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 26 },
      2: { cellWidth: 45 },
      3: { cellWidth: 30 },
      4: { cellWidth: 28 },
      5: { cellWidth: 32 },
      6: { cellWidth: 32 },
      7: { cellWidth: 45 },
    },
    margin: { top: 28, left: 14, right: 14 },
  });

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=issuances_${
        new Date().toISOString().split('T')[0]
      }.pdf`,
    },
  });
}
