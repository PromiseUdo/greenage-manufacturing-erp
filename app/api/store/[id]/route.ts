// app/api/store/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ProductCategory } from '@prisma/client';
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

    const storeItem = await prisma.storeItem.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!storeItem) {
      return NextResponse.json(
        { error: 'Store item not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(storeItem);
  } catch (error) {
    console.error('Error fetching store item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store item' },
      { status: 500 },
    );
  }
}

export async function PUT(
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

    if (
      !['ADMIN', 'STORE_KEEPER', 'OPERATION_MANAGER'].includes(
        session.user.role,
      )
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      productId,
      category,
      quantity,
      unit,
      location,
      condition,
      unitPrice,
      unitCostPrice,
      batchNumber,
      productionDate,
      warrantyExpiry,
      notes,
    } = body;

    // Check if store item exists
    const existing = await prisma.storeItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Store item not found' },
        { status: 404 },
      );
    }

    // Handle "External" productId
    let finalProductId = productId;
    if (productId === "External") {
      finalProductId = null;
    }

    // Update store item
    const storeItem = await prisma.storeItem.update({
      where: { id },
      data: {
        name,
        productId: finalProductId,
        category: category as ProductCategory,
        quantity,
        unit,
        location: location || null,
        condition: condition || 'NEW',
        unitPrice: unitPrice || null,
        unitCostPrice: unitCostPrice || null,
        batchNumber: batchNumber || null,
        productionDate: productionDate ? new Date(productionDate) : null,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        notes: notes || null,
      },
      include: {
        product: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Updated Store Item',
        module: 'Store',
        details: {
          storeItemId: storeItem.id,
          itemNumber: storeItem.itemNumber,
          changes: body,
        },
      },
    });

    return NextResponse.json(storeItem);
  } catch (error) {
    console.error('Error updating store item:', error);
    return NextResponse.json(
      { error: 'Failed to update store item' },
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

    if (!['ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete
    const storeItem = await prisma.storeItem.update({
      where: { id },
      data: { isActive: false },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Deleted Store Item',
        module: 'Store',
        details: {
          storeItemId: storeItem.id,
          itemNumber: storeItem.itemNumber,
        },
      },
    });

    return NextResponse.json({ message: 'Store item deleted successfully' });
  } catch (error) {
    console.error('Error deleting store item:', error);
    return NextResponse.json(
      { error: 'Failed to delete store item' },
      { status: 500 },
    );
  }
}
