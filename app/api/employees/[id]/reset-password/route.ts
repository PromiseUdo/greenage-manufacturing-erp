// src/app/api/employees/[id]/reset-password/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const params = await context.params;
  const { id } = params;

  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { newPassword } = body;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 },
      );
    }

    // Generate new password if not provided
    const password =
      newPassword ||
      `${employee.user.name.split(' ')[0].toLowerCase()}${new Date().getFullYear()}`;
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update employee and user passwords
    await prisma.$transaction(async (tx) => {
      // Update employee flags
      await tx.employee.update({
        where: { id },
        data: {
          mustChangePassword: true,
          lastPasswordChange: new Date(),
        },
      });

      // Update user password
      await tx.user.update({
        where: { id: employee.userId },
        data: {
          password: hashedPassword,
        },
      });
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Reset Employee Password',
        module: 'Staff Management',
        details: {
          employeeId: id,
          employeeNumber: employee.employeeNumber,
          name: employee.user.name,
          resetBy: session.user.name,
        },
      },
    });

    return NextResponse.json({
      message: 'Password reset successfully',
      credentials: {
        email: employee.user.email,
        newPassword: password,
        mustChangePassword: true,
      },
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 },
    );
  }
}
