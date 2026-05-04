import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/rd/projects/[id]/material-requisition/[reqId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; reqId: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { reqId } = await params;

    const requisition = await prisma.productionMaterialRequisition.findUnique({
      where: { id: reqId },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        fulfilledBy: { select: { id: true, name: true } },
        researchProject: { select: { id: true, projectNumber: true, title: true } },
        items: {
          include: {
            material: {
              select: { id: true, name: true, partNumber: true, unit: true, currentStock: true, category: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!requisition) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });

    return NextResponse.json(requisition);
  } catch (error) {
    console.error('Error fetching R&D requisition:', error);
    return NextResponse.json({ error: 'Failed to fetch requisition' }, { status: 500 });
  }
}

// PATCH /api/rd/projects/[id]/material-requisition/[reqId]
// Inventory team fulfills the requisition — same logic as production MRQ fulfillment
// body: { items: [{ itemId, quantityIssued, notes? }], inventoryNotes?, cancel? }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reqId: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { reqId } = await params;
    const body = await request.json();
    const { items, inventoryNotes, cancel } = body;

    const requisition = await prisma.productionMaterialRequisition.findUnique({
      where: { id: reqId },
      include: {
        items: {
          include: {
            material: { select: { id: true, name: true, unit: true, currentStock: true } },
          },
        },
        researchProject: { select: { id: true, projectNumber: true, title: true } },
      },
    }) as any;

    if (!requisition) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });

    if (requisition.status === 'FULFILLED' || requisition.status === 'CANCELLED') {
      return NextResponse.json(
        { error: `Requisition is already ${requisition.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    if (cancel) {
      await prisma.productionMaterialRequisition.update({
        where: { id: reqId },
        data: { status: 'CANCELLED', inventoryNotes: inventoryNotes || null },
      });
      return NextResponse.json({ success: true, status: 'CANCELLED' });
    }

    const updatePromises: Promise<any>[] = [];
    const issuancePromises: Promise<any>[] = [];

    for (const itemUpdate of items as { itemId: string; quantityIssued: number; notes?: string }[]) {
      const existingItem = requisition.items.find((i: any) => i.id === itemUpdate.itemId);
      if (!existingItem) continue;

      const newlyIssued = Math.max(0, itemUpdate.quantityIssued ?? 0);
      const previouslyIssued = existingItem.quantityIssued || 0;
      const totalIssued = previouslyIssued + newlyIssued;
      const required = existingItem.quantityRequired;

      let itemStatus = 'PENDING';
      if (totalIssued === 0)       itemStatus = 'UNAVAILABLE';
      else if (totalIssued >= required) itemStatus = 'ISSUED';
      else                          itemStatus = 'PARTIAL';

      updatePromises.push(
        prisma.productionMaterialRequisitionItem.update({
          where: { id: itemUpdate.itemId },
          data: { quantityIssued: totalIssued, status: itemStatus, notes: itemUpdate.notes || null },
        })
      );

      if (newlyIssued > 0) {
        updatePromises.push(
          prisma.material.update({
            where: { id: existingItem.materialId },
            data: { currentStock: { decrement: newlyIssued } },
          })
        );

        issuancePromises.push(
          prisma.materialIssuance.create({
            data: {
              materialId: existingItem.materialId,
              quantity: newlyIssued,
              batchNumber: `MRQ-${requisition.requisitionNumber}`,
              issuedTo: `R&D Project ${requisition.researchProject?.projectNumber ?? ''} — ${requisition.researchProject?.title ?? ''}`,
              issuedBy: session.user.name as string,
              purpose: `R&D material sign-out for project ${requisition.researchProject?.projectNumber ?? ''}`,
            },
          })
        );
      }
    }

    await Promise.all([...updatePromises, ...issuancePromises]);

    const updatedItems = await prisma.productionMaterialRequisitionItem.findMany({
      where: { requisitionId: reqId },
    });

    const allIssued = updatedItems.every((i: any) => i.status === 'ISSUED');
    const anyIssued = updatedItems.some((i: any) => i.status === 'ISSUED' || i.status === 'PARTIAL');
    const newStatus = allIssued ? 'FULFILLED' : anyIssued ? 'PARTIALLY_FULFILLED' : 'PENDING';

    await prisma.productionMaterialRequisition.update({
      where: { id: reqId },
      data: {
        status: newStatus as any,
        inventoryNotes: inventoryNotes || null,
        fulfilledById: session.user.id,
        fulfilledAt: newStatus === 'FULFILLED' ? new Date() : null,
      },
    });

    if (anyIssued) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: `${newStatus === 'FULFILLED' ? 'Fulfilled' : 'Partially fulfilled'} R&D Requisition ${requisition.requisitionNumber}`,
          module: 'Inventory',
          details: {
            requisitionNumber: requisition.requisitionNumber,
            projectId: requisition.researchProjectId,
          },
        },
      });
    }

    const final = await prisma.productionMaterialRequisition.findUnique({
      where: { id: reqId },
      include: {
        requestedBy: { select: { id: true, name: true } },
        fulfilledBy:  { select: { id: true, name: true } },
        items: {
          include: {
            material: { select: { id: true, name: true, partNumber: true, unit: true, currentStock: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return NextResponse.json(final);
  } catch (error) {
    console.error('Error fulfilling R&D requisition:', error);
    return NextResponse.json({ error: 'Failed to fulfill requisition' }, { status: 500 });
  }
}
