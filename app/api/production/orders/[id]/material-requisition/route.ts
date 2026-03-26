// app/api/production/orders/[id]/material-requisition/route.ts
// GET  – fetch this order's requisition(s) alongside the full BOM for the product
// POST – auto-generate a new requisition from the product's BOM × production quantity

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// ──────────────────────────────────────────────
// GET /api/production/orders/[id]/material-requisition
// ──────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const order = await prisma.productionOrder.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        quantity: true,
        productId: true,
        product: {
          select: {
            id: true,
            name: true,
            productNumber: true,
            materials: {
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
            },
          },
        },
        units: {
          select: { id: true, unitId: true, unitNumber: true, status: true },
          orderBy: { unitNumber: 'asc' },
        },
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

    if (!order) {
      return NextResponse.json({ error: 'Production order not found' }, { status: 404 });
    }

    // Build BOM summary — quantities are per single unit
    const bom = order.product.materials.map((pm) => ({
      materialId: pm.materialId,
      material: pm.material,
      qtyPerUnit: pm.quantity,
      totalRequired: pm.quantity * order.quantity,
      currentStock: pm.material.currentStock,
      shortfall: Math.max(0, pm.quantity * order.quantity - pm.material.currentStock),
    }));

    // Group requisitions by unit (sorted newest first by the Prisma query already)
    const unitData = order.units.map((unit) => ({
      id: unit.id,
      unitId: unit.unitId,
      status: unit.status,
      requisitions: order.materialRequisitions.filter(
        (r) => r.productionUnitId === unit.id
      ),
    }));

    return NextResponse.json({
      orderId: id,
      orderNumber: order.orderNumber,
      quantity: order.quantity,
      product: order.product,
      bom,
      units: unitData,
    });
  } catch (error) {
    console.error('Error fetching material requisition:', error);
    return NextResponse.json({ error: 'Failed to fetch material requisition' }, { status: 500 });
  }
}

// ──────────────────────────────────────────────
// POST /api/production/orders/[id]/material-requisition
// Auto-generate from BOM × quantity
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
    // `items` overrides the auto-BOM: [{ materialId, quantityRequired }]
    // `type` labels the requisition: 'BOM_SIGNOUT' (P-1) | 'REPLACEMENT' (P-4)
    const { notes, items: customItems, type: reqType, productionUnitId } = body;

    if (!productionUnitId) {
      return NextResponse.json(
        { error: 'productionUnitId is required. All material requisitions must be scoped to a specific production unit.' },
        { status: 400 }
      );
    }

    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            materials: {
              include: {
                material: {
                  select: {
                    id: true,
                    name: true,
                    partNumber: true,
                    unit: true,
                    currentStock: true,
                  },
                },
              },
            },
          },
        },
        materialRequisitions: {
          select: { id: true, status: true, productionUnitId: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Production order not found' }, { status: 404 });
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

    // ──────────────────────────────────────────────────────────────────
    // Build requisition items — use customItems if provided,
    // otherwise auto-compute from BOM × production quantity
    // ──────────────────────────────────────────────────────────────────
    let itemsToCreate: { materialId: string; quantityRequired: number; stockAtRequest: number; status: string }[] = [];

    if (customItems && Array.isArray(customItems) && customItems.length > 0) {
      // Custom items list — fetch current stock snapshot for each
      const materialIds = customItems.map((ci: any) => ci.materialId);
      const materials = await prisma.material.findMany({
        where: { id: { in: materialIds } },
        select: { id: true, currentStock: true },
      });
      const stockMap = new Map(materials.map((m) => [m.id, m.currentStock]));
      itemsToCreate = customItems.map((ci: any) => ({
        materialId: ci.materialId,
        quantityRequired: Number(ci.quantityRequired),
        stockAtRequest: stockMap.get(ci.materialId) ?? 0,
        status: 'PENDING',
      }));
    } else {
      // Auto from BOM
      if (!order.product.materials || order.product.materials.length === 0) {
        return NextResponse.json(
          { error: 'This product has no BOM materials defined. Please add materials to the product first.' },
          { status: 400 }
        );
      }
      itemsToCreate = order.product.materials.map((pm) => ({
        materialId: pm.materialId,
        quantityRequired: pm.quantity * (productionUnitId ? 1 : order.quantity),
        stockAtRequest: pm.material.currentStock,
        status: 'PENDING',
      }));
    }

    if (itemsToCreate.length === 0) {
      return NextResponse.json({ error: 'No materials in the requisition' }, { status: 400 });
    }

    const typePrefix = reqType === 'REPLACEMENT' ? '[Replacement – P4] ' : '[BOM Sign-out – P1] ';
    const finalNotes = notes ? `${typePrefix}${notes}` : typePrefix.trim();

    // Create requisition + items
    const requisition = await prisma.productionMaterialRequisition.create({
      data: {
        requisitionNumber,
        productionOrderId: id,
        productionUnitId: productionUnitId || null,
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

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `Created Material Requisition ${requisitionNumber} for ${order.orderNumber}`,
        module: 'Production',
        details: {
          orderId: id,
          orderNumber: order.orderNumber,
          requisitionNumber,
          itemCount: order.product.materials.length,
          productionUnitId: productionUnitId || null,
        },
      },
    });

    return NextResponse.json(requisition, { status: 201 });
  } catch (error) {
    console.error('Error creating material requisition:', error);
    return NextResponse.json({ error: 'Failed to create material requisition' }, { status: 500 });
  }
}
