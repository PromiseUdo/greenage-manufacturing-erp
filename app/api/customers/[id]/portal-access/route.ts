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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    // Check if customer already has portal access
    if (customer.userId) {
      return NextResponse.json(
        { error: 'Customer already has portal access' },
        { status: 409 },
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

    // Generate default password if not provided
    const defaultPassword =
      password ||
      `${customer.name.split(' ')[0].toLowerCase()}${new Date().getFullYear()}`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Create User and link to Customer in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create User account
      const user = await tx.user.create({
        data: {
          name: customer.name,
          email,
          password: hashedPassword,
          role: 'SALES_TEAM', // Default role for customer portal users
          isActive: true,
          isVerified: true, // No email verification for customers
        },
      });

      // Link User to Customer
      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          userId: user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              isActive: true,
            },
          },
        },
      });

      return { customer: updatedCustomer, defaultPassword };
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Created Customer Portal Access',
        module: 'Customer Management',
        details: {
          customerId,
          customerName: customer.name,
          email,
        },
      },
    });

    return NextResponse.json(
      {
        customer: result.customer,
        credentials: {
          email,
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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    // Remove portal access (User will be set to null, not deleted)
    await prisma.$transaction(async (tx) => {
      // Deactivate user
      await tx.user.update({
        where: { id: customer.userId! },
        data: { isActive: false },
      });

      // Remove link from customer
      await tx.customer.update({
        where: { id: customerId },
        data: {
          userId: null,
        },
      });
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
