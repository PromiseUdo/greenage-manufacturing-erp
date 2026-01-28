// src/app/api/customers/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
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

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            createdAt: true,
          },
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            quantity: true,
            deliveryDate: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 orders
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 },
    );
  }
}

export async function PATCH(
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

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SALES_TEAM') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phone, address, contactPerson } = body;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 },
      );
    }

    // Update Customer and User (if exists) in transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update Customer record
      const updatedCustomer = await tx.customer.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(email !== undefined && { email: email || null }),
          ...(phone && { phone }),
          ...(address && { address }),
          ...(contactPerson !== undefined && {
            contactPerson: contactPerson || null,
          }),
        },
      });

      // Update User record name if exists
      if (customer.userId && name) {
        await tx.user.update({
          where: { id: customer.userId },
          data: { name },
        });
      }

      // Return customer with updated user info
      return await tx.customer.findUnique({
        where: { id },
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
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Updated Customer',
        module: 'Customer Management',
        details: {
          customerId: id,
          changes: body,
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 },
      );
    }

    // Check if customer has orders
    if (customer._count.orders > 0) {
      return NextResponse.json(
        { error: 'Cannot delete customer with existing orders' },
        { status: 400 },
      );
    }

    // Delete customer (User will be set to null or deleted based on schema)
    await prisma.customer.delete({
      where: { id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Deleted Customer',
        module: 'Customer Management',
        details: {
          customerId: id,
          customerName: customer.name,
        },
      },
    });

    return NextResponse.json({
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 },
    );
  }
}
