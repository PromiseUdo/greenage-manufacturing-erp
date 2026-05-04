import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// PATCH /api/rd/projects/[id]/notes/[noteId] — edit note content
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { noteId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    const note = await prisma.researchNote.findUnique({ where: { id: noteId } });
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

    // Only the author or a superadmin can edit
    if (note.authorId !== session.user.id && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'You can only edit your own notes' }, { status: 403 });
    }

    const updated = await prisma.researchNote.update({
      where: { id: noteId },
      data: { content: content.trim() },
      include: { author: { select: { id: true, name: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating research note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

// DELETE /api/rd/projects/[id]/notes/[noteId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { noteId } = await params;

    const note = await prisma.researchNote.findUnique({ where: { id: noteId } });
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

    if (note.authorId !== session.user.id && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'You can only delete your own notes' }, { status: 403 });
    }

    await prisma.researchNote.delete({ where: { id: noteId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting research note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
