// src/app/api/inventory/tools/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ToolCategory, ToolCondition } from '@prisma/client';
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

    const tool = await prisma.tool.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: {
            lendings: true,
          },
        },
      },
    });

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    return NextResponse.json(tool);
  } catch (error) {
    console.error('Error fetching tool:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool' },
      { status: 500 },
    );
  }
}

export async function PATCH(
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

    const body = await request.json();
    const {
      name,
      category,
      description,
      serialNumber,
      manufacturer,
      purchaseDate,
      purchaseCost,
      location,
      condition,
    } = body;

    const existingTool = await prisma.tool.findUnique({
      where: { id: id },
    });

    if (!existingTool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    const tool = await prisma.tool.update({
      where: { id: id },
      data: {
        ...(name && { name }),
        ...(category && { category: category as ToolCategory }),
        description,
        serialNumber,
        manufacturer,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchaseCost,
        location,
        ...(condition && { condition: condition as ToolCondition }),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Updated Tool',
        module: 'Inventory',
        details: {
          toolId: tool.id,
          toolNumber: tool.id,
          name: tool.name,
          changes: body,
        },
      },
    });

    return NextResponse.json(tool);
  } catch (error) {
    console.error('Error updating tool:', error);
    return NextResponse.json(
      { error: 'Failed to update tool' },
      { status: 500 },
    );
  }
}

// export async function DELETE(
//   request: NextRequest,
//   context: { params: { id: string } | Promise<{ id: string }> },
// ) {
//   const params = await context.params;
//   const { id } = params;
//   try {
//     const session = await auth();

//     if (!session) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     if (session.user.role !== 'ADMIN') {
//       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
//     }

//     const tool = await prisma.tool.findUnique({
//       where: { id: id },
//     });

//     if (!tool) {
//       return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
//     }

//     // Check if tool has active lendings
//     const activeLendings = await prisma.toolLending.count({
//       where: {
//         toolId: id,
//         status: 'ISSUED',
//       },
//     });

//     if (activeLendings > 0) {
//       return NextResponse.json(
//         { error: 'Cannot delete tool with active lendings' },
//         { status: 400 },
//       );
//     }

//     // Soft delete
//     await prisma.tool.update({
//       where: { id: id },
//       data: { isActive: false },
//     });

//     await prisma.activityLog.create({
//       data: {
//         userId: session.user.id,
//         action: 'Deleted Tool',
//         module: 'Inventory',
//         details: {
//           toolId: tool.id,
//           toolNumber: tool.id,
//           name: tool.name,
//         },
//       },
//     });

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error('Error deleting tool:', error);
//     return NextResponse.json(
//       { error: 'Failed to delete tool' },
//       { status: 500 },
//     );
//   }
// }

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

    const tool = await prisma.tool.findUnique({
      where: { id: id },
      include: {
        toolGroup: true,
      },
    });

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Check if tool is currently IN_USE (issued and not returned)
    const activeLending = await prisma.toolLending.findFirst({
      where: {
        toolId: id,
        status: 'ISSUED',
      },
    });

    if (activeLending) {
      return NextResponse.json(
        {
          error:
            'Cannot delete tool that is currently in use. Please ensure the tool is returned before deleting.',
        },
        { status: 400 },
      );
    }

    // Check if tool status is IN_USE
    if (tool.status === 'IN_USE') {
      return NextResponse.json(
        {
          error:
            'Cannot delete tool with IN_USE status. Please update the status or ensure the tool is returned.',
        },
        { status: 400 },
      );
    }

    // Start a transaction to handle group quantity updates
    await prisma.$transaction(async (tx) => {
      // If tool belongs to a group, update group quantities
      if (tool.toolGroupId) {
        const toolGroup = await tx.toolGroup.findUnique({
          where: { id: tool.toolGroupId },
        });

        if (toolGroup) {
          const newTotalQuantity = Math.max(0, toolGroup.totalQuantity - 1);
          const newAvailableQuantity =
            tool.status === 'AVAILABLE'
              ? Math.max(0, toolGroup.availableQuantity - 1)
              : toolGroup.availableQuantity;

          await tx.toolGroup.update({
            where: { id: tool.toolGroupId },
            data: {
              totalQuantity: newTotalQuantity,
              availableQuantity: newAvailableQuantity,
            },
          });
        }
      }

      // Soft delete the tool
      await tx.tool.update({
        where: { id: id },
        data: { isActive: false },
      });

      // Create activity log
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'Deleted Tool',
          module: 'Inventory',
          details: {
            toolId: tool.id,
            toolNumber: tool.toolId,
            name: tool.name,
            belongedToGroup: tool.toolGroupId ? true : false,
            groupId: tool.toolGroupId,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Tool deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting tool:', error);
    return NextResponse.json(
      { error: 'Failed to delete tool' },
      { status: 500 },
    );
  }
}
