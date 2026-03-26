// GET  – list all reworks for a unit (newest first)
// POST – create a new rework (triggered when QC-1 fails)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

type Params = { params: Promise<{ id: string; unitId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { unitId } = await params;

    const reworks = await prisma.unitRework.findMany({
      where: { productionUnitId: unitId },
      include: {
        createdBy: { select: { id: true, name: true } },
        completedBy: { select: { id: true, name: true } },
        tasks: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reworks });
  } catch (error) {
    console.error('Error fetching reworks:', error);
    return NextResponse.json({ error: 'Failed to fetch reworks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['ADMIN', 'PRODUCTION_MANAGER', 'OPERATION_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, unitId } = await params;
    const { faultDescription, notes, tasks, triggeredByStepId } = await request.json();

    // Determine round number
    const existingCount = await prisma.unitRework.count({ where: { productionUnitId: unitId } });

    const rework = await prisma.unitRework.create({
      data: {
        productionUnitId: unitId,
        round: existingCount + 1,
        triggeredByStepId: triggeredByStepId || 'QC-1',
        faultDescription: faultDescription || null,
        notes: notes || null,
        createdById: session.user.id,
        tasks: tasks?.length
          ? { create: tasks.map((t: any, i: number) => ({ name: t.name, description: t.description || null, sortOrder: i })) }
          : undefined,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        tasks: { orderBy: { sortOrder: 'asc' } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `Created Rework Round ${rework.round} for unit in order ${id}`,
        module: 'Production',
        details: { orderId: id, unitId, reworkId: rework.id, faultDescription },
      },
    });

    return NextResponse.json(rework, { status: 201 });
  } catch (error) {
    console.error('Error creating rework:', error);
    return NextResponse.json({ error: 'Failed to create rework' }, { status: 500 });
  }
}
