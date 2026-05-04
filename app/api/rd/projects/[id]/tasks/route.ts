import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST /api/rd/projects/[id]/tasks — add a task to a research project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { name, assignedToId } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Task name is required' }, { status: 400 });
    }

    const project = await prisma.researchProject.findUnique({
      where: { id },
      select: { id: true, projectNumber: true },
    });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const task = await prisma.researchTask.create({
      data: {
        researchProjectId: id,
        name: name.trim(),
        assignedToId: assignedToId || null,
      },
      include: {
        assignedTo:  { select: { id: true, name: true } },
        completedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating research task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
