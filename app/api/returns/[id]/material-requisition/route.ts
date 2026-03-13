// app/api/returns/[id]/material-requisition/route.ts
// GET  – fetch material requisitions for a specific return
// POST – generate a new material requisition for parts replaced during repair

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// ──────────────────────────────────────────────
// GET /api/returns/[id]/material-requisition
// ──────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const returnItem = await prisma.productReturn.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, productNumber: true } },
        materialRequisitions: {
          include: {
            requestedBy: { select: { id: true, name: true, email: true } },
            fulfilledBy: { select: { id: true, name: true, email: true } },
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
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!returnItem) {
      return NextResponse.json({ error: 'Product return not found' }, { status: 404 });
    }

    return NextResponse.json({
      returnId: id,
      returnNumber: returnItem.returnNumber,
      product: returnItem.product,
      requisitions: returnItem.materialRequisitions,
      latestRequisition: returnItem.materialRequisitions[0] || null,
    });
  } catch (error) {
    console.error('Error fetching material requisitions for return:', error);
    return NextResponse.json({ error: 'Failed to fetch material requisitions' }, { status: 500 });
  }
}

// ──────────────────────────────────────────────
// POST /api/returns/[id]/material-requisition
// Create a new requisition for parts needed
// ──────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    
    // items: [{ materialId, quantityRequired }]
    const { notes, items } = body;

    const returnItem = await prisma.productReturn.findUnique({
      where: { id },
      include: {
        materialRequisitions: {
          where: { status: { in: ['PENDING', 'PARTIALLY_FULFILLED'] } },
          select: { id: true, status: true },
        },
      },
    });

    if (!returnItem) {
      return NextResponse.json({ error: 'Product return not found' }, { status: 404 });
    }

    // Block if there's already an open requisition
    if (returnItem.materialRequisitions.length > 0) {
      return NextResponse.json(
        { error: 'There is already an open material requisition for this return. Fulfill or cancel it first.' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: 'No materials specified for requisition' }, { status: 400 });
    }

    // Generate requisition number
    const lastReq = await prisma.productionMaterialRequisition.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { requisitionNumber: true },
    });
    
    const reqCount = lastReq
      ? parseInt(lastReq.requisitionNumber.split('-')[2]) + 1
      : 1;
    const requisitionNumber = `MRQ-${new Date().getFullYear()}-${reqCount.toString().padStart(4, '0')}`;

    // Compute stock at request
    const materialIds = items.map((ci: any) => ci.materialId);
    const materials = await prisma.material.findMany({
      where: { id: { in: materialIds } },
      select: { id: true, currentStock: true },
    });
    const stockMap = new Map(materials.map((m) => [m.id, m.currentStock]));
    
    const itemsToCreate = items.map((ci: any) => ({
      materialId: ci.materialId,
      quantityRequired: Number(ci.quantityRequired),
      stockAtRequest: stockMap.get(ci.materialId) ?? 0,
      status: 'PENDING',
    }));

    const finalNotes = notes ? `[Repair Parts] ${notes}` : `[Repair Parts]`;

    // Create requisition + items
    const requisition = await prisma.productionMaterialRequisition.create({
      data: {
        requisitionNumber,
        productReturnId: id,
        requestedById: session.user.id,
        notes: finalNotes,
        items: {
          create: itemsToCreate,
        },
      },
      include: {
        requestedBy: { select: { id: true, name: true } },
        items: {
          include: {
            material: {
              select: {
                id: true, name: true, partNumber: true, unit: true,
                currentStock: true, category: true,
              },
            },
          },
        },
      },
    });

    // Log the requisition
    await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: `Requested repair materials ${requisitionNumber} for Return ${returnItem.returnNumber}`,
          module: 'Production',
          details: {
            returnId: id,
            requisitionId: requisition.id,
            requisitionNumber,
          },
        },
      });

    return NextResponse.json(requisition, { status: 201 });
  } catch (error) {
    console.error('Error creating material requisition for return:', error);
    return NextResponse.json({ error: 'Failed to create material requisition' }, { status: 500 });
  }
}
