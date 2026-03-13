// src/app/api/products/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { productNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              quoteLineItems: true,
              orderLineItems: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
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

    const body = await request.json();
    const {
      name,
      description,
      category,
      specifications,
      costPrice, // Renamed from basePrice
      model,
      warranty,
      leadTime,
      images,
      productCode,
      primaryImage,
      notes,
      tags,
      designFiles, // New
      materials,   // New: [{ materialId, quantity }]
    } = body;

    // Validation
    if (!name || !description || !category || !costPrice || !productCode) {
      return NextResponse.json(
        {
          error:
            'Name, description, category, product code and cost price are required',
        },
        { status: 400 },
      );
    }

    // Validate product code format
    if (!/^[A-Z0-9]{3,4}$/.test(productCode)) {
      return NextResponse.json(
        { error: 'Product code must be 3-4 uppercase alphanumeric characters' },
        { status: 400 },
      );
    }

    // Check if product code already exists
    const existingProduct = await prisma.product.findUnique({
      where: { productCode },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product code already exists' },
        { status: 400 },
      );
    }

    if (
      !specifications ||
      !Array.isArray(specifications) ||
      specifications.length === 0
    ) {
      return NextResponse.json(
        { error: 'At least one specification is required' },
        { status: 400 },
      );
    }

    // Generate product number
    const year = new Date().getFullYear();
    const lastProduct = await prisma.product.findFirst({
      where: {
        productNumber: { contains: `PRD-${year}` },
      },
      orderBy: { createdAt: 'desc' },
    });

    let productNumber;
    if (lastProduct) {
      const lastNumber = parseInt(lastProduct.productNumber.split('-')[2]);
      productNumber = `PRD-${year}-${String(lastNumber + 1).padStart(3, '0')}`;
    } else {
      productNumber = `PRD-${year}-001`;
    }

    // Create product and materials in transaction
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          productNumber,
          name,
          description,
          category,
          productCode,
          lastUnitNumber: 0,
          specifications,
          costPrice,
          model,
          isActive: false,
          warranty,
          leadTime,
          images: images || [],
          primaryImage,
          notes,
          tags: tags || [],
          designFiles: designFiles || [],
          createdById: session.user.id,
        },
      });

      // Create product materials if provided
      if (materials && materials.length > 0) {
        for (const mat of materials) {
          await tx.productMaterial.create({
            data: {
              productId: newProduct.id,
              materialId: mat.materialId,
              quantity: mat.quantity,
            },
          });
        }
      }

      return newProduct;
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Created Product',
        module: 'Products',
        details: {
          productId: product.id,
          productNumber: product.productNumber,
          name: product.name,
        },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 },
    );
  }
}
