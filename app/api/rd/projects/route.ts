import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/rd/projects — list all research projects
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // OPEN | CLOSED | (all if omitted)

    const projects = await prisma.researchProject.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        createdBy: { select: { id: true, name: true } },
        closedBy:  { select: { id: true, name: true } },
        _count: { select: { tasks: true, notes: true, materialRequisitions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Attach pending-task count for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (p) => {
        const pendingTasks = await prisma.researchTask.count({
          where: { researchProjectId: p.id, status: 'PENDING' },
        });
        return { ...p, pendingTasks };
      })
    );

    return NextResponse.json({ projects: projectsWithStats });
  } catch (error) {
    console.error('Error fetching research projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/rd/projects — create a new research project
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, description } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Generate project number — RD-YYYY-NNNN
    const lastProject = await prisma.researchProject.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { projectNumber: true },
    });
    const count = lastProject
      ? parseInt(lastProject.projectNumber.split('-')[2]) + 1
      : 1;
    const projectNumber = `RD-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;

    const project = await prisma.researchProject.create({
      data: {
        projectNumber,
        title: title.trim(),
        description: description?.trim() || null,
        createdById: session.user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `Created R&D Project ${projectNumber}: ${project.title}`,
        module: 'R&D',
        details: { projectId: project.id, projectNumber },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating research project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
