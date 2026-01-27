// src/app/api/inventory/tools/route.ts - UPDATED

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

    // Fetch Tool Groups
    const groupWhere: any = { isActive: true };
    if (search) {
      groupWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { groupNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) groupWhere.category = category as ToolCategory;

    const toolGroups = await prisma.toolGroup.findMany({
      where: groupWhere,
      include: {
        tools: {
          where: { isActive: true },
          orderBy: { toolId: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Fetch Standalone Tools (not part of any group)
    // For MongoDB, we need to check if toolGroupId doesn't exist or is null
    const toolWhere: any = {
      isActive: true,
    };

    if (search) {
      toolWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { toolId: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) toolWhere.category = category as ToolCategory;
    if (status) toolWhere.status = status as ToolStatus;

    // Fetch all tools, then filter out grouped ones
    const allTools = await prisma.tool.findMany({
      where: toolWhere,
      orderBy: { name: 'asc' },
    });

    // Filter to only standalone tools (those without a group)
    const standaloneTools = allTools.filter((tool) => !tool.toolGroupId);

    const total = toolGroups.length + standaloneTools.length;

    return NextResponse.json({
      toolGroups,
      standaloneTools,
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
      category,
      description,
      manufacturer,
      model,
      quantity,
      unitCost,
      purchaseDate,
      location,
      condition,
      isGrouped,
    } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 },
      );
    }

    if (isGrouped) {
      // Create Tool Group
      if (!quantity || quantity < 1) {
        return NextResponse.json(
          { error: 'Quantity must be at least 1 for grouped tools' },
          { status: 400 },
        );
      }

      // Generate group number
      const lastGroup = await prisma.toolGroup.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      const groupNum = lastGroup
        ? parseInt(lastGroup.groupNumber.split('-')[1]) + 1
        : 1;
      const groupNumber = `TOOLGRP-${String(groupNum).padStart(3, '0')}`;

      // Create group and individual tools in transaction
      const result = await prisma.$transaction(
        async (tx) => {
          // Create the group
          const group = await tx.toolGroup.create({
            data: {
              name,
              groupNumber,
              category: category as ToolCategory,
              description,
              manufacturer,
              model,
              totalQuantity: quantity,
              availableQuantity: quantity,
              unitCost,
            },
          });

          // Prepare tools data for batch creation
          const toolsData = [];
          for (let i = 1; i <= quantity; i++) {
            const toolId = `${groupNumber}-${String(i).padStart(3, '0')}`;
            toolsData.push({
              toolId,
              name,
              toolGroupId: group.id,
              category: category as ToolCategory,
              description,
              manufacturer,
              purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
              purchaseCost: unitCost,
              location,
              condition: (condition as ToolCondition) || 'GOOD',
              status: ToolStatus.AVAILABLE,
            });
          }

          // Batch create all tools at once
          await tx.tool.createMany({
            data: toolsData,
          });

          return { group, toolCount: quantity };
        },
        {
          maxWait: 10000, // Maximum time to wait for transaction to start (10s)
          timeout: 30000, // Maximum time for transaction to complete (30s)
        },
      );

      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'Created Tool Group',
          module: 'Inventory',
          details: {
            groupId: result.group.id,
            groupNumber: result.group.groupNumber,
            name: result.group.name,
            quantity,
          },
        },
      });

      return NextResponse.json(result, { status: 201 });
    } else {
      // Create Single Tool
      const lastTool = await prisma.tool.findFirst({
        where: { toolGroupId: null },
        orderBy: { createdAt: 'desc' },
      });
      const toolNum = lastTool
        ? parseInt(lastTool.toolId.split('-')[1]) + 1
        : 1;
      const toolId = `TOOL-${String(toolNum).padStart(3, '0')}`;

      const tool = await prisma.tool.create({
        data: {
          toolId,
          name,
          category: category as ToolCategory,
          description,
          manufacturer,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          purchaseCost: unitCost,
          location,
          condition: (condition as ToolCondition) || 'GOOD',
          status: ToolStatus.AVAILABLE,
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'Created Tool',
          module: 'Inventory',
          details: {
            toolId: tool.id,
            toolNumber: tool.toolId,
            name: tool.name,
          },
        },
      });

      return NextResponse.json(tool, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating tool:', error);
    return NextResponse.json(
      { error: 'Failed to create tool' },
      { status: 500 },
    );
  }
}
