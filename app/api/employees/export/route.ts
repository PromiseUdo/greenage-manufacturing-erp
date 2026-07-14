// src/app/api/employees/export/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format as formatDate } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'excel';
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const isActive = searchParams.get('isActive');

    const where: any = {};

    if (search) {
      where.OR = [
        { employeeNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (department) {
      where.OR = [
        { department: { contains: department, mode: 'insensitive' } },
        { departmentId: department },
      ];
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true, isActive: true },
        },
        appRole: {
          select: { name: true },
        },
        department: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'excel') {
      return exportToExcel(employees);
    } else if (format === 'pdf') {
      return exportToPDF(employees);
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Employees export error:', error);
    return NextResponse.json(
      { error: 'Failed to export employees' },
      { status: 500 },
    );
  }
}

function exportToExcel(employees: any[]) {
  const data = employees.map((e) => ({
    'Employee ID': e.employeeNumber,
    Name: e.user?.name || '—',
    Email: e.user?.email || '—',
    Phone: e.phone || '—',
    Department: e.department?.name?.replace(/_/g, ' ') || '—',
    Role: e.appRole?.name?.replace(/_/g, ' ') || '—',
    Status: e.user?.isActive ? 'Active' : 'Inactive',
    'Date Hired': formatDate(new Date(e.dateHired), 'MMM dd, yyyy'),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  ws['!cols'] = [
    { wch: 16 }, // Employee ID
    { wch: 26 }, // Name
    { wch: 28 }, // Email
    { wch: 16 }, // Phone
    { wch: 18 }, // Department
    { wch: 20 }, // Role
    { wch: 12 }, // Status
    { wch: 16 }, // Date Hired
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Employees');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=employees_${
        new Date().toISOString().split('T')[0]
      }.xlsx`,
    },
  });
}

function exportToPDF(employees: any[]) {
  const doc = new jsPDF('landscape');

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Employees List', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

  const tableData = employees.map((e) => [
    e.employeeNumber,
    e.user?.name || '—',
    e.user?.email || '—',
    e.phone || '—',
    e.department?.name?.replace(/_/g, ' ') || '—',
    e.appRole?.name?.replace(/_/g, ' ') || '—',
    e.user?.isActive ? 'Active' : 'Inactive',
    formatDate(new Date(e.dateHired), 'MMM dd, yyyy'),
  ]);

  autoTable(doc, {
    head: [
      [
        'Employee ID',
        'Name',
        'Email',
        'Phone',
        'Department',
        'Role',
        'Status',
        'Date Hired',
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
      1: { cellWidth: 40 },
      2: { cellWidth: 50 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30 },
      6: { cellWidth: 24 },
      7: { cellWidth: 28 },
    },
    margin: { top: 28, left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageCount = doc.internal.pages.length - 1;
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' },
      );
    },
  });

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=employees_${
        new Date().toISOString().split('T')[0]
      }.pdf`,
    },
  });
}
