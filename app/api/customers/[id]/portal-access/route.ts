// src/app/api/customers/[id]/portal-access/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const params = await context.params;
  const { id: customerId } = params;

  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // if (session.user.role !== 'EMPLOYEE') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 },
      );
    }

    // Fetch linked user if one exists
    const linkedUser = customer.userId
      ? await prisma.user.findUnique({ where: { id: customer.userId } })
      : null;

    // If there's already an active portal, block
    if (linkedUser?.isActive) {
      return NextResponse.json(
        { error: 'Customer already has active portal access' },
        { status: 409 },
      );
    }

    let result: { customer: any; defaultPassword: string };

    if (linkedUser) {
      // Restore: reactivate the existing user, optionally reset password
      const defaultPassword = password || undefined;
      const updateData: any = { isActive: true };

      if (defaultPassword) {
        updateData.password = await bcrypt.hash(defaultPassword, 12);
      }

      await prisma.user.update({
        where: { id: linkedUser.id },
        data: updateData,
      });

      const updatedCustomer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { user: { select: { id: true, email: true, isActive: true } } },
      });

      result = {
        customer: updatedCustomer,
        defaultPassword: defaultPassword || '(unchanged)',
      };
    } else {
      // Grant: check email is not taken by an unrelated user
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 },
        );
      }

      const defaultPassword =
        password ||
        `${customer.name.split(' ')[0].toLowerCase()}${new Date().getFullYear()}`;
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);

      result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: customer.name,
            email,
            password: hashedPassword,
            role: 'CUSTOMER',
            isActive: true,
            isVerified: true,
          },
        });

        const updatedCustomer = await tx.customer.update({
          where: { id: customerId },
          data: { userId: user.id },
          include: {
            user: { select: { id: true, email: true, isActive: true } },
          },
        });

        return { customer: updatedCustomer, defaultPassword };
      });
    }

    const portalEmail = linkedUser ? linkedUser.email : email;

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: linkedUser ? 'Restored Customer Portal Access' : 'Created Customer Portal Access',
        module: 'Customer Management',
        details: { customerId, customerName: customer.name, email: portalEmail },
      },
    });

    return NextResponse.json(
      {
        customer: result.customer,
        credentials: {
          email: portalEmail,
          password: result.defaultPassword,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating portal access:', error);
    return NextResponse.json(
      { error: 'Failed to create portal access' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const params = await context.params;
  const { id: customerId } = params;

  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // if (session.user.role !== 'EMPLOYEE') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { user: true },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 },
      );
    }

    if (!customer.userId) {
      return NextResponse.json(
        { error: 'Customer does not have portal access' },
        { status: 400 },
      );
    }

    // Deactivate the user — keeps Customer.userId intact for restore
    await prisma.user.update({
      where: { id: customer.userId! },
      data: { isActive: false },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Removed Customer Portal Access',
        module: 'Customer Management',
        details: {
          customerId,
          customerName: customer.name,
        },
      },
    });

    return NextResponse.json({
      message: 'Portal access removed successfully',
    });
  } catch (error) {
    console.error('Error removing portal access:', error);
    return NextResponse.json(
      { error: 'Failed to remove portal access' },
      { status: 500 },
    );
  }
}
