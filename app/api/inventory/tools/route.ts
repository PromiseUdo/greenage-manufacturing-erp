// src/app/api/inventory/tools/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ToolCategory, ToolStatus, ToolCondition } from '@prisma/client';
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
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { toolNumber: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category as ToolCategory;
    }

    if (status) {
      where.status = status as ToolStatus;
    }

    const [tools, total] = await Promise.all([
      prisma.tool.findMany({
        where,
        include: {
          _count: {
            select: {
              lendings: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.tool.count({ where }),
    ]);

    return NextResponse.json({
      tools,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tools' },
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

    if (!['ADMIN', 'STORE_KEEPER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      toolNumber,
      category,
      description,
      serialNumber,
      manufacturer,
      purchaseDate,
      purchaseCost,
      location,
      condition,
    } = body;

    if (!name || !toolNumber || !category) {
      return NextResponse.json(
        { error: 'Name, tool number, and category are required' },
        { status: 400 },
      );
    }

    // Check if tool number already exists
    const existing = await prisma.tool.findUnique({
      where: { toolNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Tool number already exists' },
        { status: 400 },
      );
    }

    const tool = await prisma.tool.create({
      data: {
        name,
        toolNumber,
        category: category as ToolCategory,
        description,
        serialNumber,
        manufacturer,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchaseCost,
        location,
        condition: (condition as ToolCondition) || 'GOOD',
        status: 'AVAILABLE',
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Created Tool',
        module: 'Inventory',
        details: {
          toolId: tool.id,
          toolNumber: tool.toolNumber,
          name: tool.name,
        },
      },
    });

    return NextResponse.json(tool, { status: 201 });
  } catch (error) {
    console.error('Error creating tool:', error);
    return NextResponse.json(
      { error: 'Failed to create tool' },
      { status: 500 },
    );
  }
}
