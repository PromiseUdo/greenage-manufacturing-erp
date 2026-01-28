// src/app/api/employees/route.ts
// UPDATED FOR NORMALIZED SCHEMA

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * limit;

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
      where.department = department;
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json({
      employees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      department,
      position,
      role,
      password,
      notes,
    } = body;

    // Validation
    if (!name || !email || !phone || !department || !role) {
      return NextResponse.json(
        { error: 'Name, email, phone, department, and role are required' },
        { status: 400 },
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 },
      );
    }

    // Generate employee number
    const lastEmployee = await prisma.employee.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { employeeNumber: true },
    });

    const empCount = lastEmployee
      ? parseInt(lastEmployee.employeeNumber.split('-')[1]) + 1
      : 1;
    const employeeNumber = `EMP-${empCount.toString().padStart(4, '0')}`;

    // Generate default password if not provided
    const defaultPassword =
      password ||
      `${name.split(' ')[0].toLowerCase()}${new Date().getFullYear()}`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Create User and Employee in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create User account
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          isActive: true,
          isVerified: true, // No email verification for staff
        },
      });

      // Create Employee record (linked to User)
      const employee = await tx.employee.create({
        data: {
          employeeNumber,
          userId: user.id, // Link to User
          phone,
          address,
          department,
          position,
          mustChangePassword: true,
          createdBy: session.user.name || session.user.email || 'Admin',
          notes,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
        },
      });

      return { employee, defaultPassword };
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Created Employee',
        module: 'Staff Management',
        details: {
          employeeId: result.employee.id,
          employeeNumber,
          name,
          department,
          role,
        },
      },
    });

    return NextResponse.json(
      {
        employee: result.employee,
        credentials: {
          email,
          defaultPassword: result.defaultPassword,
          mustChangePassword: true,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 },
    );
  }
}
