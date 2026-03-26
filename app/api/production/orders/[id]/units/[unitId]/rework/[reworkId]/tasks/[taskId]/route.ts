// PATCH – update a rework task (complete or skip)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

type Params = { params: Promise<{ id: string; unitId: string; reworkId: string; taskId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { unitId, reworkId, taskId } = await params;
    const { status, notes, attachments } = await request.json();

    if (!['COMPLETED', 'SKIPPED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const task = await prisma.unitReworkTask.findUnique({
      where: { id: taskId },
      select: { id: true, reworkId: true, rework: { select: { productionUnitId: true } } },
    });

    if (!task || task.reworkId !== reworkId || task.rework.productionUnitId !== unitId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updated = await prisma.unitReworkTask.update({
      where: { id: taskId },
      data: {
        status,
        notes: notes ?? undefined,
        attachments: attachments ?? undefined,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        completedById: status === 'COMPLETED' ? session.user.id : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating rework task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
