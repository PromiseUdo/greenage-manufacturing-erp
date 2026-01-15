// src/app/api/inventory/suppliers/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: {
            materials: true,
            grns: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'STORE_KEEPER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, contactPerson, email, phone, address, paymentTerms } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.update({
      where: { id: id },
      data: {
        name,
        contactPerson,
        email,
        phone,
        address,
        paymentTerms,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Updated Supplier',
        module: 'Inventory',
        details: {
          supplierId: supplier.id,
          name: supplier.name,
        },
      },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete
    const supplier = await prisma.supplier.update({
      where: { id: id },
      data: { isActive: false },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Deleted Supplier',
        module: 'Inventory',
        details: {
          supplierId: supplier.id,
          name: supplier.name,
        },
      },
    });

    return NextResponse.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}
