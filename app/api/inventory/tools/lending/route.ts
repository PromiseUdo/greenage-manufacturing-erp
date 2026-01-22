// src/app/api/inventory/tools/lending/route.ts

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
    const status = searchParams.get('status') || '';
    const toolId = searchParams.get('toolId') || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (toolId) {
      where.toolId = toolId;
    }

    const [lendings, total] = await Promise.all([
      prisma.toolLending.findMany({
        where,
        include: {
          tool: true,
        },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.toolLending.count({ where }),
    ]);

    return NextResponse.json({
      lendings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching lendings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lendings' },
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
      toolId,
      issuedTo,
      department,
      purpose,
      orderId,
      projectName,
      expectedReturn,
    } = body;

    if (!toolId || !issuedTo) {
      return NextResponse.json(
        { error: 'Tool and recipient are required' },
        { status: 400 },
      );
    }

    // Check if tool is available
    const tool = await prisma.tool.findUnique({
      where: { id: toolId },
    });

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    if (tool.status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: `Tool is not available. Current status: ${tool.status}` },
        { status: 400 },
      );
    }

    // Create lending record and update tool status in transaction
    const [lending] = await prisma.$transaction([
      prisma.toolLending.create({
        data: {
          toolId,
          issuedTo,
          department,
          purpose,
          orderId,
          projectName,
          expectedReturn: expectedReturn ? new Date(expectedReturn) : null,
          issuedBy: session.user.name!,
          status: 'ISSUED',
        },
        include: {
          tool: true,
        },
      }),
      prisma.tool.update({
        where: { id: toolId },
        data: {
          status: 'IN_USE',
          currentHolder: issuedTo,
        },
      }),
    ]);

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Tool Issued',
        module: 'Inventory',
        details: {
          toolId,
          toolName: tool.name,
          toolNumber: tool.toolNumber,
          issuedTo,
          purpose,
        },
      },
    });

    return NextResponse.json(lending, { status: 201 });
  } catch (error) {
    console.error('Error creating lending:', error);
    return NextResponse.json(
      { error: 'Failed to create lending' },
      { status: 500 },
    );
  }
}
