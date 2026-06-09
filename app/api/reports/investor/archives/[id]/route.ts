import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// ── GET — fetch a single archive by id ───────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const archive = await prisma.investorReportArchive.findUnique({
      where: { id },
    });

    if (!archive) {
      return NextResponse.json({ error: 'Archive not found' }, { status: 404 });
    }

    return NextResponse.json({ archive });
  } catch (error) {
    console.error('[investor archive GET/:id]', error);
    return NextResponse.json(
      { error: 'Failed to load archive' },
      { status: 500 },
    );
  }
}

// ── DELETE — remove an archive (SUPERADMIN only) ──────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    if (role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Only SUPERADMIN can delete archives' },
        { status: 403 },
      );
    }

    const { id } = await params;

    const existing = await prisma.investorReportArchive.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Archive not found' }, { status: 404 });
    }

    await prisma.investorReportArchive.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[investor archive DELETE/:id]', error);
    return NextResponse.json(
      { error: 'Failed to delete archive' },
      { status: 500 },
    );
  }
}
