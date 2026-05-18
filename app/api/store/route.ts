// app/api/store/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ProductCategory } from '@prisma/client';
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
    const condition = searchParams.get('condition') || '';

    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { itemNumber: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category as ProductCategory;
    }

    if (condition) {
      where.condition = condition;
    }

    const [storeItems, total] = await Promise.all([
      prisma.storeItem.findMany({
        where,
        include: {
          product: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.storeItem.count({ where }),
    ]);

    console.log(storeItems, 'storeItems');

    return NextResponse.json({
      storeItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching store items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store items' },
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

    // if (
    //   !['ADMIN', 'STORE_KEEPER', 'OPERATION_MANAGER'].includes(
    //     session?.user?.role,
    //   )
    // ) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const body = await request.json();
    const {
      itemNumber,
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
      imageUrl,
      imagePublicId,
    } = body;

    // Validate required fields
    if (!itemNumber || !name || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: itemNumber, name, category' },
        { status: 400 },
      );
    }

    // Check if item number already exists
    const existing = await prisma.storeItem.findUnique({
      where: { itemNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Item number already exists' },
        { status: 400 },
      );
    }

    // Handle "External" productId
    let finalProductId = productId;
    if (productId === 'External') {
      finalProductId = null;
    }

    // Verify product exists (if provided and not External)
    if (finalProductId) {
      const product = await prisma.product.findUnique({
        where: { id: finalProductId },
      });

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 400 },
        );
      }
    }

    // Create store item
    const storeItem = await prisma.storeItem.create({
      data: {
        itemNumber,
        name,
        productId: finalProductId,
        category: category as ProductCategory,
        quantity: quantity || 0,
        unit: unit || 'pcs',
        location: location || null,
        condition: condition || 'NEW',
        unitPrice: unitPrice || null,
        unitCostPrice: unitCostPrice || null,
        batchNumber: batchNumber || null,
        productionDate: productionDate ? new Date(productionDate) : null,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        notes: notes || null,
        imageUrl: imageUrl || null,
        imagePublicId: imagePublicId || null,
      },
      include: {
        product: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Created Store Item',
        module: 'Store',
        details: {
          storeItemId: storeItem.id,
          itemNumber: storeItem.itemNumber,
          name: storeItem.name,
        },
      },
    });

    return NextResponse.json(storeItem, { status: 201 });
  } catch (error) {
    console.error('Error creating store item:', error);
    return NextResponse.json(
      { error: 'Failed to create store item' },
      { status: 500 },
    );
  }
}
