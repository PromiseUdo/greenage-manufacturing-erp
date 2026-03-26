import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

const UNIT_INCLUDE = {
  inspectedBy: { select: { id: true, name: true } },
  approvedBy: { select: { id: true, name: true } },
  repairTasks: {
    include: {
      assignedTo: { select: { id: true, name: true } },
      completedBy: { select: { id: true, name: true } },
    },
    orderBy: { sortOrder: 'asc' as const },
  },
};

// GET — fetch a single unit
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> },
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: returnId, unitId } = await params;

    const unit = await prisma.returnUnit.findFirst({
      where: { id: unitId, returnId },
      include: UNIT_INCLUDE,
    });
    if (!unit) return NextResponse.json({ error: 'Unit not found' }, { status: 404 });

    return NextResponse.json(unit);
  } catch (error) {
    console.error('Error fetching return unit:', error);
    return NextResponse.json({ error: 'Failed to fetch unit' }, { status: 500 });
  }
}

// PATCH — advance unit through workflow stages
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: returnId, unitId } = await params;
    const body = await request.json();

    const unit = await prisma.returnUnit.findFirst({ where: { id: unitId, returnId } });
    if (!unit) return NextResponse.json({ error: 'Unit not found' }, { status: 404 });

    const {
      status,
      evaluationNotes,
      evaluationAttachments,
      recommendedAction,
      approvalAttachments,
      serialNumber,
    } = body;

    const updateData: any = {};

    if (serialNumber !== undefined) updateData.serialNumber = serialNumber;

    if (status) {
      updateData.status = status;

      // Inspection submission
      if (status === 'PENDING_APPROVAL') {
        if (evaluationNotes !== undefined) updateData.evaluationNotes = evaluationNotes;
        if (evaluationAttachments !== undefined) updateData.evaluationAttachments = evaluationAttachments;
        updateData.inspectedById = session.user.id;
        updateData.inspectedAt = new Date();
      }

      // Manager approval or scrap
      if (status === 'IN_REPAIR' || status === 'SCRAPPED') {
        if (recommendedAction !== undefined) updateData.recommendedAction = recommendedAction;
        if (approvalAttachments !== undefined) updateData.approvalAttachments = approvalAttachments;
        updateData.approvedById = session.user.id;
        updateData.approvedAt = new Date();
      }
    }

    const updated = await prisma.returnUnit.update({
      where: { id: unitId },
      data: updateData,
      include: UNIT_INCLUDE,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating return unit:', error);
    return NextResponse.json({ error: 'Failed to update unit' }, { status: 500 });
  }
}
