// src/app/api/products/[id]/route.ts

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

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        materials: {
          include: {
            material: true,
          },
        },
        _count: {
          select: {
            quotes: true,
            orders: true,
            invoices: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
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

    const body = await request.json();
    const {
      name,
      description,
      category,
      specifications,
      costPrice,
      model,
      warranty,
      leadTime,
      isActive,
      isAvailable,
      notes,
      designFiles,
      materials,
    } = body;

    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(category && { category }),
        ...(specifications !== undefined && { specifications }),
        ...(costPrice !== undefined && { costPrice }),
        ...(model !== undefined && { model }),
        ...(warranty !== undefined && { warranty }),
        ...(leadTime !== undefined && { leadTime }),
        ...(isActive !== undefined && { isActive }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(notes !== undefined && { notes }),
        ...(designFiles !== undefined && { designFiles }),
        ...(materials && {
          materials: {
            deleteMany: {},
            create: materials.map((m: any) => ({
              materialId: m.materialId,
              quantity: Number(m.quantity),
            })),
          },
        }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        materials: {
          include: {
            material: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Updated Product',
        module: 'Products',
        details: {
          productId: id,
          productNumber: product.productNumber,
          changes: 'Updated product details',
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
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

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            quotes: true,
            orders: true,
            invoices: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if product has related records
    if (
      product._count.quotes > 0 ||
      product._count.orders > 0 ||
      product._count.invoices > 0
    ) {
      return NextResponse.json(
        {
          error:
            'Cannot delete product with existing quotes, orders, or invoices. Deactivate it instead.',
        },
        { status: 400 },
      );
    }

    // Delete product
    await prisma.product.delete({ where: { id } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Deleted Product',
        module: 'Products',
        details: {
          productId: id,
          productNumber: product.productNumber,
          name: product.name,
        },
      },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 },
    );
  }
}
