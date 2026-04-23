// PATCH – complete or cancel a rework. On completion, reset the triggering QC step (QC-1 or QC-3) to PENDING.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

type Params = {
  params: Promise<{ id: string; unitId: string; reworkId: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // if (!['ADMIN', 'PRODUCTION_MANAGER', 'OPERATION_MANAGER'].includes(session.user.role)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const { id, unitId, reworkId } = await params;
    const { action, notes } = await request.json(); // action: 'COMPLETE' | 'CANCEL'

    const rework = await prisma.unitRework.findUnique({
      where: { id: reworkId },
      include: { tasks: true },
    });

    if (!rework || rework.productionUnitId !== unitId) {
      return NextResponse.json({ error: 'Rework not found' }, { status: 404 });
    }

    if (action === 'COMPLETE') {
      const pendingTasks = rework.tasks.filter((t) => t.status === 'PENDING');
      if (pendingTasks.length > 0) {
        return NextResponse.json(
          {
            error: `${pendingTasks.length} task(s) are still pending. Complete or skip them first.`,
          },
          { status: 400 },
        );
      }

      await prisma.unitRework.update({
        where: { id: reworkId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completedById: session.user.id,
          notes: notes || rework.notes,
        },
      });

      // Reset the QC step that triggered this rework back to PENDING so the unit is re-assessed.
      // QC-1 reworks return to QC-1; QC-3 reworks return to QC-3.
      const targetStepId = rework.triggeredByStepId ?? 'QC-1';
      const targetTracking = await prisma.unitStepTracking.findFirst({
        where: { unitId, actionItem: { stepId: targetStepId } },
      });
      if (targetTracking) {
        await prisma.unitStepTracking.update({
          where: { id: targetTracking.id },
          data: {
            status: 'PENDING',
            completedAt: null,
            completedById: null,
            startedAt: null,
            decisionOutcome: null,
            notes: null,
          },
        });
      }

      // If triggered by QC-3, also reset QC-4 (Packaging) from SKIPPED back to PENDING
      // so it becomes available again after the rework re-passes QC-3.
      if (targetStepId === 'QC-3') {
        const qc4Tracking = await prisma.unitStepTracking.findFirst({
          where: { unitId, actionItem: { stepId: 'QC-4' } },
        });
        if (qc4Tracking && qc4Tracking.status === 'SKIPPED') {
          await prisma.unitStepTracking.update({
            where: { id: qc4Tracking.id },
            data: {
              status: 'PENDING',
              completedAt: null,
              completedById: null,
              startedAt: null,
              decisionOutcome: null,
              notes: null,
            },
          });
        }
      }
    } else if (action === 'CANCEL') {
      await prisma.unitRework.update({
        where: { id: reworkId },
        data: { status: 'CANCELLED', notes: notes || rework.notes },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use COMPLETE or CANCEL.' },
        { status: 400 },
      );
    }

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `${action === 'COMPLETE' ? 'Completed' : 'Cancelled'} Rework Round ${rework.round}`,
        module: 'Production',
        details: { orderId: id, unitId, reworkId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating rework:', error);
    return NextResponse.json(
      { error: 'Failed to update rework' },
      { status: 500 },
    );
  }
}
