// POST – add a task to an in-progress rework

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

type Params = {
  params: Promise<{ id: string; unitId: string; reworkId: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // if (!['ADMIN', 'PRODUCTION_MANAGER', 'OPERATION_MANAGER'].includes(session.user.role)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const { unitId, reworkId } = await params;
    const { name, description } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Task name is required' },
        { status: 400 },
      );
    }

    const rework = await prisma.unitRework.findUnique({
      where: { id: reworkId },
      select: {
        id: true,
        productionUnitId: true,
        status: true,
        _count: { select: { tasks: true } },
      },
    });

    if (!rework || rework.productionUnitId !== unitId) {
      return NextResponse.json({ error: 'Rework not found' }, { status: 404 });
    }
    if (rework.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Cannot add tasks to a completed or cancelled rework' },
        { status: 400 },
      );
    }

    const task = await prisma.unitReworkTask.create({
      data: {
        reworkId,
        name: name.trim(),
        description: description?.trim() || null,
        sortOrder: rework._count.tasks,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error adding rework task:', error);
    return NextResponse.json({ error: 'Failed to add task' }, { status: 500 });
  }
}
