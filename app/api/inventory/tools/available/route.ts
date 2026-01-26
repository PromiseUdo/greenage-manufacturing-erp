// src/app/api/inventory/tools/available/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tool groups with available tools
    const toolGroups = await prisma.toolGroup.findMany({
      where: {
        isActive: true,
        availableQuantity: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        groupNumber: true,
        category: true,
        availableQuantity: true,
      },
      orderBy: { name: 'asc' },
    });

    // Get standalone available tools
    const singleTools = await prisma.tool.findMany({
      where: {
        isActive: true,
        // toolGroupId: null,
        status: 'AVAILABLE',
      },
      select: {
        id: true,
        name: true,
        toolId: true,
        category: true,
        toolGroupId: true,
      },
      orderBy: { name: 'asc' },
    });

    const standaloneTools = singleTools.filter((tool) => !tool.toolGroupId);

    // Format for autocomplete
    const tools = [
      ...toolGroups.map((group) => ({
        id: group.id,
        name: group.name,
        groupNumber: group.groupNumber,
        availableQuantity: group.availableQuantity,
        isGroup: true,
        category: group.category,
      })),
      ...standaloneTools.map((tool) => ({
        id: tool.id,
        name: tool.name,
        toolId: tool.toolId,
        availableQuantity: 1,
        isGroup: false,
        category: tool.category,
      })),
    ];

    return NextResponse.json({ tools });
  } catch (error) {
    console.error('Error fetching available tools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available tools' },
      { status: 500 },
    );
  }
}

// src/app/api/inventory/tools/lending/route.ts - UPDATED POST

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
      quantity = 1,
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

    // Check if it's a group or individual tool
    const toolGroup = await prisma.toolGroup.findUnique({
      where: { id: toolId },
      include: {
        tools: {
          where: {
            isActive: true,
            status: 'AVAILABLE',
          },
          take: quantity,
        },
      },
    });

    if (toolGroup) {
      // Handle group tool lending
      if (toolGroup.availableQuantity < quantity) {
        return NextResponse.json(
          {
            error: `Only ${toolGroup.availableQuantity} tools available in this group`,
          },
          { status: 400 },
        );
      }

      if (toolGroup.tools.length < quantity) {
        return NextResponse.json(
          { error: 'Not enough available tools in group' },
          { status: 400 },
        );
      }

      // Create lending records for each tool and update statuses
      const lendings = await prisma.$transaction(async (tx) => {
        const results = [];

        for (const tool of toolGroup.tools.slice(0, quantity)) {
          // Create lending record
          const lending = await tx.toolLending.create({
            data: {
              toolId: tool.id,
              quantity: 1, // Each record is for 1 tool
              issuedTo,
              department,
              purpose,
              orderId,
              projectName,
              expectedReturn: expectedReturn ? new Date(expectedReturn) : null,
              issuedBy: session.user.name!,
              status: 'ISSUED',
            },
          });

          // Update tool status
          await tx.tool.update({
            where: { id: tool.id },
            data: {
              status: 'IN_USE',
              currentHolder: issuedTo,
            },
          });

          results.push(lending);
        }

        // Update group available quantity
        await tx.toolGroup.update({
          where: { id: toolGroup.id },
          data: {
            availableQuantity: toolGroup.availableQuantity - quantity,
          },
        });

        return results;
      });

      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'Tools Issued (Group)',
          module: 'Inventory',
          details: {
            groupId: toolGroup.id,
            groupName: toolGroup.name,
            quantity,
            issuedTo,
            purpose,
          },
        },
      });

      return NextResponse.json({ lendings, quantity }, { status: 201 });
    } else {
      // Handle individual tool lending
      const tool = await prisma.tool.findUnique({
        where: { id: toolId },
      });

      if (!tool) {
        return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
      }

      if (tool.status !== 'AVAILABLE') {
        return NextResponse.json(
          {
            error: `Tool is not available. Current status: ${tool.status}`,
          },
          { status: 400 },
        );
      }

      const [lending] = await prisma.$transaction([
        prisma.toolLending.create({
          data: {
            toolId,
            quantity: 1,
            issuedTo,
            department,
            purpose,
            orderId,
            projectName,
            expectedReturn: expectedReturn ? new Date(expectedReturn) : null,
            issuedBy: session.user.name!,
            status: 'ISSUED',
          },
          include: { tool: true },
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
            toolNumber: tool.toolId,
            issuedTo,
            purpose,
          },
        },
      });

      return NextResponse.json(lending, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating lending:', error);
    return NextResponse.json(
      { error: 'Failed to create lending' },
      { status: 500 },
    );
  }
}
