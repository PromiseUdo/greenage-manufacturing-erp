import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

const projectInclude = {
  createdBy:   { select: { id: true, name: true, email: true } },
  closedBy:    { select: { id: true, name: true } },
  reopenedBy:  { select: { id: true, name: true } },
  tasks: {
    include: {
      assignedTo:  { select: { id: true, name: true } },
      completedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  notes: {
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
  materialRequisitions: {
    include: {
      requestedBy: { select: { id: true, name: true } },
      fulfilledBy: { select: { id: true, name: true } },
      items: {
        include: {
          material: {
            select: { id: true, name: true, partNumber: true, unit: true, currentStock: true },
          },
        },
        orderBy: { createdAt: 'asc' as const },
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
};

// GET /api/rd/projects/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const project = await prisma.researchProject.findUnique({
      where: { id },
      include: projectInclude,
    });

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching research project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// PATCH /api/rd/projects/[id]
// body: { title?, description? }          — update fields
//       { action: 'close' }               — close project (all tasks must be DONE)
//       { action: 'reopen' }              — reopen project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { action, title, description } = body;

    const project = await prisma.researchProject.findUnique({
      where: { id },
      include: { tasks: { select: { status: true } } },
    });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    if (action === 'close') {
      const hasPending = project.tasks.some((t) => t.status === 'PENDING');
      if (hasPending) {
        return NextResponse.json(
          { error: 'Cannot close project: there are still pending tasks.' },
          { status: 400 }
        );
      }
      const updated = await prisma.researchProject.update({
        where: { id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          closedById: session.user.id,
        },
        include: projectInclude,
      });
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: `Closed R&D Project ${project.projectNumber}`,
          module: 'R&D',
          details: { projectId: id },
        },
      });
      return NextResponse.json(updated);
    }

    if (action === 'reopen') {
      const updated = await prisma.researchProject.update({
        where: { id },
        data: {
          status: 'OPEN',
          reopenedAt: new Date(),
          reopenedById: session.user.id,
        },
        include: projectInclude,
      });
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: `Reopened R&D Project ${project.projectNumber}`,
          module: 'R&D',
          details: { projectId: id },
        },
      });
      return NextResponse.json(updated);
    }

    // Default: update title/description
    const updated = await prisma.researchProject.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
      include: projectInclude,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating research project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}
