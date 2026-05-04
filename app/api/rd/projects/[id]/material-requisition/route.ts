import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

const reqInclude = {
  requestedBy: { select: { id: true, name: true, email: true } },
  fulfilledBy: { select: { id: true, name: true } },
  items: {
    include: {
      material: {
        select: {
          id: true,
          name: true,
          partNumber: true,
          unit: true,
          currentStock: true,
          category: true,
          unitCost: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

// GET /api/rd/projects/[id]/material-requisition
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
      select: { id: true, projectNumber: true, title: true },
    });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const requisitions = await prisma.productionMaterialRequisition.findMany({
      where: { researchProjectId: id },
      include: reqInclude,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ project, requisitions });
  } catch (error) {
    console.error('Error fetching R&D requisitions:', error);
    return NextResponse.json({ error: 'Failed to fetch requisitions' }, { status: 500 });
  }
}

// POST /api/rd/projects/[id]/material-requisition
// body: { items: [{ materialId, quantityRequired }], notes? }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { items, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one material item is required' }, { status: 400 });
    }

    const project = await prisma.researchProject.findUnique({
      where: { id },
      select: { id: true, projectNumber: true, title: true },
    });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    // Generate requisition number — same pattern as production MRQs
    const lastReq = await prisma.productionMaterialRequisition.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { requisitionNumber: true },
    });
    const reqCount = lastReq
      ? parseInt(lastReq.requisitionNumber.split('-')[2]) + 1
      : 1;
    const requisitionNumber = `MRQ-${new Date().getFullYear()}-${reqCount.toString().padStart(4, '0')}`;

    // Fetch current stock snapshot for each requested material
    const materialIds = items.map((i: any) => i.materialId);
    const materials = await prisma.material.findMany({
      where: { id: { in: materialIds } },
      select: { id: true, currentStock: true },
    });
    const stockMap = new Map(materials.map((m) => [m.id, m.currentStock]));

    const requisition = await prisma.productionMaterialRequisition.create({
      data: {
        requisitionNumber,
        researchProjectId: id,
        requestedById: session.user.id,
        notes: notes?.trim() || null,
        items: {
          create: items.map((item: any) => ({
            materialId: item.materialId,
            quantityRequired: Number(item.quantityRequired),
            stockAtRequest: stockMap.get(item.materialId) ?? 0,
            status: 'PENDING',
          })),
        },
      },
      include: reqInclude,
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `Raised Material Requisition ${requisitionNumber} for R&D Project ${project.projectNumber}`,
        module: 'R&D',
        details: { projectId: id, requisitionNumber },
      },
    });

    return NextResponse.json(requisition, { status: 201 });
  } catch (error) {
    console.error('Error creating R&D requisition:', error);
    return NextResponse.json({ error: 'Failed to create requisition' }, { status: 500 });
  }
}
