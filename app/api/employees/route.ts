// src/app/api/employees/route.ts
// UPDATED FOR NORMALIZED SCHEMA

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { isSuperAdmin } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // if (session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

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
      where.OR = [
        { department: { contains: department, mode: 'insensitive' } },
        { departmentId: department },
      ];
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
          appRole: {
            select: {
              name: true,
            },
          },
          department: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ]);
    console.log('====================================');
    console.log(employees);
    console.log('====================================');
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

    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Only the superadmin can create employees.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      departmentId,
      position,
      appRoleId,
      password,
      notes,
    } = body;

    // Validation
    if (!name || !email || !phone || !departmentId || !appRoleId) {
      return NextResponse.json(
        {
          error: 'Name, email, phone, department, and system role are required',
        },
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

    const dbRole = await prisma.role.findUnique({ where: { id: appRoleId } });
    if (!dbRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const dbDepartment = await prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!dbDepartment) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 },
      );
    }

    // Generate default password if not provided
    const defaultPassword =
      password ||
      `${name.split(' ')[0].toLowerCase()}${new Date().getFullYear()}`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Create User and Employee in transaction, retrying on employeeNumber collision
    const MAX_RETRIES = 5;
    let result: { employee: any; defaultPassword: string } | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // Derive next employee number from the highest existing suffix.
      // Done outside the transaction so retries re-read the latest state.
      const lastEmployee = await prisma.employee.findFirst({
        orderBy: { employeeNumber: 'desc' },
        select: { employeeNumber: true },
      });

      const lastNum = lastEmployee
        ? parseInt(lastEmployee.employeeNumber.replace(/^EMP-0*/, '') || '0', 10)
        : 0;
      const employeeNumber = `EMP-${(lastNum + 1 + attempt).toString().padStart(4, '0')}`;

      try {
        result = await prisma.$transaction(async (tx) => {
          // Create User account
          const user = await tx.user.create({
            data: {
              name,
              email,
              password: hashedPassword,
              role: 'EMPLOYEE',
              isActive: true,
              isVerified: true, // No email verification for staff
            },
          });

          // Create Employee record (linked to User)
          const employee = await tx.employee.create({
            data: {
              employeeNumber,
              userId: user.id,
              appRoleId: dbRole.id,
              phone,
              address,
              departmentId: dbDepartment.id,
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

        // Transaction succeeded — exit retry loop
        break;
      } catch (err: any) {
        const isNumberCollision =
          err?.code === 'P2002' &&
          (err?.meta?.target as string[])?.includes('employeeNumber');

        if (isNumberCollision && attempt < MAX_RETRIES - 1) {
          // Another request claimed this number concurrently — retry with a higher suffix
          continue;
        }

        throw err; // Re-throw email conflicts and other real errors
      }
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to generate a unique employee number. Please try again.' },
        { status: 500 },
      );
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Created Employee',
        module: 'Staff Management',
        details: {
          employeeId: result.employee.id,
          employeeNumber: result.employee.employeeNumber,
          name,
          department: dbDepartment.name,
          role: dbRole.name,
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
