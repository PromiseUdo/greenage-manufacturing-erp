import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST /api/rd/projects/[id]/notes — add a free-form note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    const project = await prisma.researchProject.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const note = await prisma.researchNote.create({
      data: {
        researchProjectId: id,
        content: content.trim(),
        authorId: session.user.id,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating research note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
