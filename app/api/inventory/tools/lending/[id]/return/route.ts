// src/app/api/inventory/tools/lending/[id]/return/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { ToolCondition, ToolStatus } from '@prisma/client';
import { auth } from '@/lib/auth';

export async function POST(
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
    const { returnCondition, returnNotes } = body;

    if (!returnCondition) {
      return NextResponse.json(
        { error: 'Return condition is required' },
        { status: 400 },
      );
    }

    // Get the lending record
    const lending = await prisma.toolLending.findUnique({
      where: { id: id },
      include: { tool: true },
    });

    if (!lending) {
      return NextResponse.json({ error: 'Lending not found' }, { status: 404 });
    }

    if (lending.status === 'RETURNED') {
      return NextResponse.json(
        { error: 'Tool already returned' },
        { status: 400 },
      );
    }

    // Determine new tool status based on return condition
    let newToolStatus: ToolStatus = 'AVAILABLE';
    let newLendingStatus = 'RETURNED';

    if (returnCondition === 'NEEDS_REPAIR' || returnCondition === 'POOR') {
      newToolStatus = 'UNDER_MAINTENANCE';
    } else if (returnCondition === 'DAMAGED') {
      newToolStatus = 'DAMAGED';
      newLendingStatus = 'DAMAGED';
    }

    // Update lending record and tool status in transaction
    const [updatedLending] = await prisma.$transaction([
      prisma.toolLending.update({
        where: { id: id },
        data: {
          returnedAt: new Date(),
          returnedTo: session.user.name,
          returnCondition: returnCondition as ToolCondition,
          returnNotes,
          status: newLendingStatus as any,
        },
        include: { tool: true },
      }),
      prisma.tool.update({
        where: { id: lending.toolId },
        data: {
          status: newToolStatus,
          currentHolder: null,
          condition: returnCondition as ToolCondition,
        },
      }),
    ]);

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Tool Returned',
        module: 'Inventory',
        details: {
          toolId: lending.toolId,
          toolName: lending.tool.name,
          toolNumber: lending.tool.toolNumber,
          returnedFrom: lending.issuedTo,
          returnCondition,
          newStatus: newToolStatus,
        },
      },
    });

    return NextResponse.json(updatedLending);
  } catch (error) {
    console.error('Error returning tool:', error);
    return NextResponse.json(
      { error: 'Failed to return tool' },
      { status: 500 },
    );
  }
}
