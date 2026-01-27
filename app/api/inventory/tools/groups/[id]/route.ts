import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = id;

    const group = await prisma.toolGroup.findUnique({
      where: {
        id: groupId,
        isActive: true,
      },
      include: {
        tools: {
          where: {
            isActive: true,
          },
          orderBy: {
            toolId: 'asc',
          },
          select: {
            id: true,
            toolId: true,
            status: true,
            condition: true,
            currentHolder: true,
            location: true,
            purchaseDate: true,
            purchaseCost: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Tool group not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: group.id,
      name: group.name,
      groupNumber: group.groupNumber,
      category: group.category,
      description: group.description,
      manufacturer: group.manufacturer,
      model: group.model,
      totalQuantity: group.totalQuantity,
      availableQuantity: group.availableQuantity,
      unitCost: group.unitCost,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      tools: group.tools,
    });
  } catch (error) {
    console.error('Error fetching tool group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool group' },
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

    if (!['ADMIN', 'STORE_KEEPER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch the tool group with all its tools
    const toolGroup = await prisma.toolGroup.findUnique({
      where: { id: id },
      include: {
        tools: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!toolGroup) {
      return NextResponse.json(
        { error: 'Tool group not found' },
        { status: 404 },
      );
    }

    // Check if any tool in the group is IN_USE
    const toolsInUse = toolGroup.tools.filter(
      (tool) => tool.status === 'IN_USE',
    );

    if (toolsInUse.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete tool group. ${toolsInUse.length} tool(s) in this group are currently in use.`,
          toolsInUse: toolsInUse.map((tool) => ({
            id: tool.id,
            toolId: tool.toolId,
            name: tool.name,
            currentHolder: tool.currentHolder,
          })),
        },
        { status: 400 },
      );
    }

    // Check if any tool has active lendings
    const toolIds = toolGroup.tools.map((tool) => tool.id);
    const activeLendings = await prisma.toolLending.findMany({
      where: {
        toolId: { in: toolIds },
        status: 'ISSUED',
      },
      include: {
        tool: {
          select: {
            toolId: true,
            name: true,
          },
        },
      },
    });

    if (activeLendings.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete tool group. ${activeLendings.length} tool(s) have active lendings that must be returned first.`,
          activeLendings: activeLendings.map((lending) => ({
            toolId: lending.tool.toolId,
            toolName: lending.tool.name,
            issuedTo: lending.issuedTo,
            issuedAt: lending.issuedAt,
          })),
        },
        { status: 400 },
      );
    }

    // Check if all tools are AVAILABLE
    const nonAvailableTools = toolGroup.tools.filter(
      (tool) => tool.status !== 'AVAILABLE',
    );

    if (nonAvailableTools.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete tool group. All tools must have AVAILABLE status. Found ${nonAvailableTools.length} tool(s) with different status.`,
          nonAvailableTools: nonAvailableTools.map((tool) => ({
            id: tool.id,
            toolId: tool.toolId,
            name: tool.name,
            status: tool.status,
          })),
        },
        { status: 400 },
      );
    }

    // Proceed with deletion in a transaction
    await prisma.$transaction(async (tx) => {
      // Soft delete all tools in the group
      await tx.tool.updateMany({
        where: {
          toolGroupId: id,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      // Soft delete the tool group
      await tx.toolGroup.update({
        where: { id: id },
        data: {
          isActive: false,
        },
      });

      // Create activity log
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'Deleted Tool Group',
          module: 'Inventory',
          details: {
            groupId: toolGroup.id,
            groupNumber: toolGroup.groupNumber,
            groupName: toolGroup.name,
            totalToolsDeleted: toolGroup.tools.length,
            toolIds: toolGroup.tools.map((tool) => tool.toolId),
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Tool group and ${toolGroup.tools.length} tool(s) deleted successfully`,
      deletedCount: toolGroup.tools.length,
    });
  } catch (error) {
    console.error('Error deleting tool group:', error);
    return NextResponse.json(
      { error: 'Failed to delete tool group' },
      { status: 500 },
    );
  }
}
