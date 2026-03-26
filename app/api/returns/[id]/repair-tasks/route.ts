import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

const TASK_INCLUDE = {
  assignedTo: { select: { id: true, name: true } },
  completedBy: { select: { id: true, name: true } },
};

// GET — list all repair tasks for a return
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const tasks = await prisma.returnRepairTask.findMany({
      where: { returnId: id },
      include: TASK_INCLUDE,
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching repair tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch repair tasks' }, { status: 500 });
  }
}

// POST — add a new repair task (optionally linked to a ReturnUnit)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['ADMIN', 'PRODUCTION_MANAGER', 'OPERATION_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { name, assignedToId, returnUnitId } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Task name is required' }, { status: 400 });
    }

    const productReturn = await prisma.productReturn.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!productReturn) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    if (!['IN_REPAIR', 'PENDING_APPROVAL', 'INSPECTING', 'RECEIVED'].includes(productReturn.status)) {
      return NextResponse.json(
        { error: 'Tasks can only be added while the return is active' },
        { status: 400 },
      );
    }

    // If linked to a unit, verify unit belongs to this return
    if (returnUnitId) {
      const unit = await prisma.returnUnit.findFirst({ where: { id: returnUnitId, returnId: id } });
      if (!unit) return NextResponse.json({ error: 'Unit not found on this return' }, { status: 404 });
    }

    const lastTask = await prisma.returnRepairTask.findFirst({
      where: { returnId: id, ...(returnUnitId ? { returnUnitId } : {}) },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const sortOrder = (lastTask?.sortOrder ?? -1) + 1;

    const task = await prisma.returnRepairTask.create({
      data: {
        returnId: id,
        returnUnitId: returnUnitId ?? null,
        name: name.trim(),
        sortOrder,
        status: 'PENDING',
        assignedToId: assignedToId ?? null,
      },
      include: TASK_INCLUDE,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating repair task:', error);
    return NextResponse.json({ error: 'Failed to create repair task' }, { status: 500 });
  }
}
