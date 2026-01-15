// src/app/api/inventory/materials/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MaterialCategory } from '@prisma/client';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const lowStock = searchParams.get('lowStock') === 'true';
    const supplierId = searchParams.get('supplierId') || '';

    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { partNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category as MaterialCategory;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    // Fetch materials
    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        include: {
          supplier: true,
          _count: {
            select: {
              batches: true,
              issuances: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.material.count({ where }),
    ]);

    // Filter low stock if requested
    let filteredMaterials = materials;
    if (lowStock) {
      filteredMaterials = materials.filter(
        (m) => m.currentStock <= m.reorderLevel
      );
    }

    return NextResponse.json({
      materials: filteredMaterials,
      pagination: {
        total: lowStock ? filteredMaterials.length : total,
        page,
        limit,
        totalPages: Math.ceil(
          (lowStock ? filteredMaterials.length : total) / limit
        ),
      },
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !['ADMIN', 'STORE_KEEPER', 'OPERATION_MANAGER'].includes(
        session?.user?.role
      )
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const {
      name,
      partNumber,
      category,
      unit,
      currentStock,
      reorderLevel,
      maxStockLevel,
      unitCost,
      supplierId,
    } = body;

    // Validate required fields
    if (
      !name ||
      !partNumber ||
      !category ||
      !unit ||
      reorderLevel === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if part number already exists
    const existing = await prisma.material.findUnique({
      where: { partNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Part number already exists' },
        { status: 400 }
      );
    }

    // Create material
    const material = await prisma.material.create({
      data: {
        name,
        partNumber,
        category: category as MaterialCategory,
        unit,
        currentStock: currentStock || 0,
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
        action: 'Created Material',
        module: 'Inventory',
        details: {
          materialId: material.id,
          partNumber: material.partNumber,
          name: material.name,
        },
      },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error('Error creating material:', error);
    return NextResponse.json(
      { error: 'Failed to create material' },
      { status: 500 }
    );
  }
}
