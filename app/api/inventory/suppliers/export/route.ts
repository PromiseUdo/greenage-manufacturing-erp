// src/app/api/inventory/suppliers/export/route.ts

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

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch all suppliers matching the criteria
    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        _count: {
          select: {
            materials: true,
            grns: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    if (format === 'excel') {
      return exportToExcel(suppliers);
    } else if (format === 'pdf') {
      return exportToPDF(suppliers);
    } else {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error exporting suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to export suppliers' },
      { status: 500 }
    );
  }
}

function exportToExcel(suppliers: any[]) {
  // Prepare data for Excel
  const data = suppliers.map((supplier) => ({
    'Supplier Name': supplier.name,
    'Contact Person': supplier.contactPerson || '—',
    Phone: supplier.phone,
    Email: supplier.email || '—',
    Address: supplier.address || '—',
    'Payment Terms': supplier.paymentTerms || '—',
    Status: supplier.isActive ? 'Active' : 'Inactive',
    'Materials Count': supplier._count?.materials || 0,
    'GRNs Count': supplier._count?.grns || 0,
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  const colWidths = [
    { wch: 25 }, // Supplier Name
    { wch: 20 }, // Contact Person
    { wch: 15 }, // Phone
    { wch: 25 }, // Email
    { wch: 30 }, // Address
    { wch: 20 }, // Payment Terms
    { wch: 10 }, // Status
    { wch: 15 }, // Materials Count
    { wch: 12 }, // GRNs Count
  ];
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Suppliers');

  // Generate Excel file buffer
  const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  // Return as response
  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=suppliers_${
        new Date().toISOString().split('T')[0]
      }.xlsx`,
    },
  });
}

function exportToPDF(suppliers: any[]) {
  const doc = new jsPDF('landscape');

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Suppliers List', 14, 15);

  // Add date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

  // Prepare table data
  const tableData = suppliers.map((supplier) => [
    supplier.name,
    supplier.contactPerson || '—',
    supplier.phone,
    supplier.email || '—',
    supplier.paymentTerms || '—',
    supplier.isActive ? 'Active' : 'Inactive',
    supplier._count?.materials || 0,
    supplier._count?.grns || 0,
  ]);

  // Add table
  autoTable(doc, {
    head: [
      [
        'Supplier Name',
        'Contact Person',
        'Phone',
        'Email',
        'Payment Terms',
        'Status',
        'Materials',
        'GRNs',
      ],
    ],
    body: tableData,
    startY: 28,
    theme: 'grid',
    headStyles: {
      fillColor: [25, 118, 210],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 40 }, // Supplier Name
      1: { cellWidth: 35 }, // Contact Person
      2: { cellWidth: 30 }, // Phone
      3: { cellWidth: 40 }, // Email
      4: { cellWidth: 35 }, // Payment Terms
      5: { cellWidth: 20 }, // Status
      6: { cellWidth: 20, halign: 'center' }, // Materials
      7: { cellWidth: 20, halign: 'center' }, // GRNs
    },
    margin: { top: 28, left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer with page number
      const pageCount = doc.internal.pages.length - 1;
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    },
  });

  // Generate PDF buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  // Return as response
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=suppliers_${
        new Date().toISOString().split('T')[0]
      }.pdf`,
    },
  });
}
