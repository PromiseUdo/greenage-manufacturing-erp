// src/app/api/inventory/lendingdetails/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  _req: Request,
  { params }: { params: { toolId: string } },
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const lending = await prisma.toolLending.findFirst({
      where: {
        toolId: params.toolId,
        status: 'ISSUED', // only get active one
      },
      orderBy: { issuedAt: 'desc' }, // most recent if somehow multiple
      include: {
        tool: {
          select: {
            id: true,
            name: true,
            toolNumber: true,
            category: true,
            status: true,
            condition: true,
          },
        },
      },
    });

    if (!lending) {
      return NextResponse.json(
        { error: 'No active lending found for this tool' },
        { status: 404 },
      );
    }

    return NextResponse.json(lending);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
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
      issuedTo,
      department,
      purpose,
      orderId,
      projectName,
      expectedReturn,
    } = body;

    const existingLending = await prisma.toolLending.findUnique({
      where: { id: id },
      include: { tool: true },
    });

    if (!existingLending) {
      return NextResponse.json(
        { error: 'Lending record not found' },
        { status: 404 },
      );
    }

    // Only allow updates for active lendings
    if (existingLending.status !== 'ISSUED') {
      return NextResponse.json(
        { error: 'Cannot update a returned lending record' },
        { status: 400 },
      );
    }

    const lending = await prisma.toolLending.update({
      where: { id: id },
      data: {
        ...(issuedTo && { issuedTo }),
        department,
        purpose,
        orderId,
        projectName,
        expectedReturn: expectedReturn ? new Date(expectedReturn) : null,
      },
      include: {
        tool: true,
      },
    });

    // Update tool's current holder if issuedTo changed
    if (issuedTo && issuedTo !== existingLending.issuedTo) {
      await prisma.tool.update({
        where: { id: existingLending.toolId },
        data: { currentHolder: issuedTo },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Updated Lending Record',
        module: 'Inventory',
        details: {
          lendingId: lending.id,
          toolId: lending.toolId,
          toolName: existingLending.tool.name,
          toolNumber: existingLending.tool.toolNumber,
          changes: body,
        },
      },
    });

    return NextResponse.json(lending);
  } catch (error) {
    console.error('Error updating lending record:', error);
    return NextResponse.json(
      { error: 'Failed to update lending record' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const lending = await prisma.toolLending.findUnique({
      where: { id: id },
      include: { tool: true },
    });

    if (!lending) {
      return NextResponse.json(
        { error: 'Lending record not found' },
        { status: 404 },
      );
    }

    // Only allow deletion of returned items
    if (lending.status === 'ISSUED') {
      return NextResponse.json(
        {
          error:
            'Cannot delete an active lending record. Return the tool first.',
        },
        { status: 400 },
      );
    }

    await prisma.toolLending.delete({
      where: { id: id },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Deleted Lending Record',
        module: 'Inventory',
        details: {
          lendingId: lending.id,
          toolId: lending.toolId,
          toolName: lending.tool.name,
          toolNumber: lending.tool.toolNumber,
          issuedTo: lending.issuedTo,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lending record:', error);
    return NextResponse.json(
      { error: 'Failed to delete lending record' },
      { status: 500 },
    );
  }
}
