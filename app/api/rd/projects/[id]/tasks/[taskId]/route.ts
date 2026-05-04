import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// PATCH /api/rd/projects/[id]/tasks/[taskId]
// body: { action: 'complete', completionDescription?, attachments } — mark done
//       { name?, assignedToId? }                                    — update fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { taskId } = await params;
    const body = await request.json();
    const { action, completionDescription, attachments, name, assignedToId } = body;

    const task = await prisma.researchTask.findUnique({ where: { id: taskId } });
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    if (action === 'complete') {
      if (task.status === 'DONE') {
        return NextResponse.json({ error: 'Task is already marked as done' }, { status: 400 });
      }
      if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
        return NextResponse.json(
          { error: 'At least one file attachment is required to mark a task as done' },
          { status: 400 }
        );
      }

      const updated = await prisma.researchTask.update({
        where: { id: taskId },
        data: {
          status: 'DONE',
          completionDescription: completionDescription?.trim() || null,
          attachments,
          completedAt: new Date(),
          completedById: session.user.id,
        },
        include: {
          assignedTo:  { select: { id: true, name: true } },
          completedBy: { select: { id: true, name: true } },
        },
      });
      return NextResponse.json(updated);
    }

    // Default: update name / assignee
    const updated = await prisma.researchTask.update({
      where: { id: taskId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
      },
      include: {
        assignedTo:  { select: { id: true, name: true } },
        completedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating research task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/rd/projects/[id]/tasks/[taskId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { taskId } = await params;

    const task = await prisma.researchTask.findUnique({ where: { id: taskId } });
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    await prisma.researchTask.delete({ where: { id: taskId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting research task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
