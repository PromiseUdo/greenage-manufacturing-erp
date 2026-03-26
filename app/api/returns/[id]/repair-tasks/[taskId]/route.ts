import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// PATCH — complete a repair task (mandatory attachment required)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: returnId, taskId } = await params;
    const { notes, attachments } = await request.json();

    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
      return NextResponse.json(
        { error: 'At least one photo or file must be uploaded to complete a repair task.' },
        { status: 400 },
      );
    }

    const task = await prisma.returnRepairTask.findFirst({ where: { id: taskId, returnId } });
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    if (task.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Task already completed' }, { status: 400 });
    }

    const updatedTask = await prisma.returnRepairTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completedById: session.user.id,
        notes: notes || null,
        attachments,
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        completedBy: { select: { id: true, name: true } },
      },
    });

    // If task belongs to a unit — check if ALL unit tasks are done
    let unitStatus: string | null = null;
    if (task.returnUnitId) {
      const pendingInUnit = await prisma.returnRepairTask.count({
        where: { returnUnitId: task.returnUnitId, status: 'PENDING' },
      });
      if (pendingInUnit === 0) {
        const updatedUnit = await prisma.returnUnit.update({
          where: { id: task.returnUnitId },
          data: { status: 'REPAIR_COMPLETED' },
        });
        unitStatus = updatedUnit.status;
      }
    }

    // Also check if ALL tasks across the whole return are done → set return REPAIR_COMPLETED
    const pendingCount = await prisma.returnRepairTask.count({
      where: { returnId, status: 'PENDING' },
    });
    let returnStatus: string | null = null;
    if (pendingCount === 0) {
      const updatedReturn = await prisma.productReturn.update({
        where: { id: returnId },
        data: { status: 'REPAIR_COMPLETED' },
      });
      returnStatus = updatedReturn.status;
    }

    return NextResponse.json({ task: updatedTask, unitStatus, returnStatus });
  } catch (error) {
    console.error('Error completing repair task:', error);
    return NextResponse.json({ error: 'Failed to complete repair task' }, { status: 500 });
  }
}

// DELETE — remove a pending task
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['ADMIN', 'PRODUCTION_MANAGER', 'OPERATION_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: returnId, taskId } = await params;

    const task = await prisma.returnRepairTask.findFirst({ where: { id: taskId, returnId } });
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    if (task.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Cannot delete a completed task' }, { status: 400 });
    }

    await prisma.returnRepairTask.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting repair task:', error);
    return NextResponse.json({ error: 'Failed to delete repair task' }, { status: 500 });
  }
}
