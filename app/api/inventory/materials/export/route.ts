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
    const category = searchParams.get('category') || '';
    const lowStock = searchParams.get('lowStock') === 'true';

    // Build where clause for database query
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { partNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    // Fetch materials from database (without lowStock filter yet)
    const materialsFromDb = await prisma.material.findMany({
      where,
      include: {
        supplier: {
          select: { name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Apply low stock filter in memory (clean, type-safe, performant for typical inventory sizes)
    const materials = lowStock
      ? materialsFromDb.filter((m) => m.currentStock <= m.reorderLevel)
      : materialsFromDb;

    if (format === 'excel') {
      return exportToExcel(materials);
    } else if (format === 'pdf') {
      return exportToPDF(materials);
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Materials export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function exportToExcel(materials: any[]) {
  const data = materials.map((m) => ({
    'Material Name': m.name,
    'Part Number': m.partNumber || '—',
    Category: m.category.replace(/_/g, ' '),
    'Current Stock': `${m.currentStock} ${m.unit}`,
    'Reorder Level': `${m.reorderLevel} ${m.unit}`,
    'Unit Cost': m.unitCost
      ? new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN',
          minimumFractionDigits: 0,
        }).format(m.unitCost)
      : '—',
    Status:
      m.currentStock === 0
        ? 'Out of Stock'
        : m.currentStock <= m.reorderLevel
        ? 'Low Stock'
        : 'In Stock',
    Supplier: m.supplier?.name || '—',
    'Min Order Qty': m.minimumOrderQuantity || '—',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  ws['!cols'] = [
    { wch: 30 }, // Name
    { wch: 18 }, // Part#
    { wch: 18 }, // Category
    { wch: 16 }, // Current Stock
    { wch: 16 }, // Reorder
    { wch: 16 }, // Unit Cost
    { wch: 14 }, // Status
    { wch: 22 }, // Supplier
    { wch: 14 }, // MOQ
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Materials');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=materials_${
        new Date().toISOString().split('T')[0]
      }.xlsx`,
    },
  });
}

function exportToPDF(materials: any[]) {
  const doc = new jsPDF('landscape');

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Materials Inventory', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

  const tableData = materials.map((m) => [
    m.name,
    m.partNumber || '—',
    m.category.replace(/_/g, ' '),
    `${m.currentStock} ${m.unit}`,
    `${m.reorderLevel} ${m.unit}`,
    m.unitCost
      ? new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN',
          minimumFractionDigits: 0,
        }).format(m.unitCost)
      : '—',
    m.currentStock === 0
      ? 'Out of Stock'
      : m.currentStock <= m.reorderLevel
      ? 'Low Stock'
      : 'In Stock',
    m.supplier?.name || '—',
  ]);

  autoTable(doc, {
    head: [
      [
        'Name',
        'Part #',
        'Category',
        'Current Stock',
        'Reorder Level',
        'Unit Cost',
        'Status',
        'Supplier',
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
      0: { cellWidth: 45 },
      1: { cellWidth: 30 },
      2: { cellWidth: 28 },
      3: { cellWidth: 28 },
      4: { cellWidth: 28 },
      5: { cellWidth: 28 },
      6: { cellWidth: 32 },
      7: { cellWidth: 38 },
    },
    margin: { top: 28, left: 14, right: 14 },
  });

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=materials_${
        new Date().toISOString().split('T')[0]
      }.pdf`,
    },
  });
}
