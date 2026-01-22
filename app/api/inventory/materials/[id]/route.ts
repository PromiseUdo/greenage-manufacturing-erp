// src/app/api/inventory/materials/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MaterialCategory } from '@prisma/client';
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

    const material = await prisma.material.findUnique({
      where: { id: id },
      include: {
        supplier: true,
        batches: {
          orderBy: { receivedDate: 'desc' },
          take: 10,
        },
        issuances: {
          orderBy: { issuedAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            batches: true,
            issuances: true,
          },
        },
      },
    });

    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(material);
  } catch (error) {
    console.error('Error fetching material:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const params = await context.params; // ✅ await params
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
      category,
      unit,
      currentStock,
      reorderLevel,
      maxStockLevel,
      unitCost,
      supplierId,
    } = body;

    // Check if material exists
    const existing = await prisma.material.findUnique({
      where: { id: id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 },
      );
    }

    // Update material
    const material = await prisma.material.update({
      where: { id: id },
      data: {
        name,
        category: category as MaterialCategory,
        unit,
        currentStock,
        reorderLevel,
        maxStockLevel,
        unitCost,
        supplierId: supplierId || null,
      },
      include: {
        supplier: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Updated Material',
        module: 'Inventory',
        details: {
          materialId: material.id,
          partNumber: material.partNumber,
          changes: body,
        },
      },
    });

    return NextResponse.json(material);
  } catch (error) {
    console.error('Error updating material:', error);
    return NextResponse.json(
      { error: 'Failed to update material' },
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

    // Soft delete by setting isActive to false
    const material = await prisma.material.update({
      where: { id: id },
      data: { isActive: false },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Deleted Material',
        module: 'Inventory',
        details: {
          materialId: material.id,
          partNumber: material.partNumber,
        },
      },
    });

    return NextResponse.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    return NextResponse.json(
      { error: 'Failed to delete material' },
      { status: 500 },
    );
  }
}
