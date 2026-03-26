// app/api/store/pending-production/route.ts
//
// GET  — list all items awaiting store receipt:
//         1. Production units whose QC-4 (Packaging) tracking is COMPLETED
//            and storeReceiptCreated = false
//         2. Return units whose repair tasks are all completed (REPAIR_COMPLETED)
//            and storeReceiptCreated = false
//
// POST — receive a single item into store inventory.
//        Body: { type: 'unit', unitId } | { type: 'return', returnId }

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // ── 1. Production units: QC-4 (Packaging) completed + not yet in store ──
    const qc5Trackings = await prisma.unitStepTracking.findMany({
      where: {
        status: 'COMPLETED',
        actionItem: { stepId: 'QC-4' },
      },
      select: {
        unitId: true,
        completedAt: true,
        completedBy: { select: { id: true, name: true } },
      },
    });

    const productionUnits = qc5Trackings.length > 0
      ? await prisma.productionUnit.findMany({
          where: {
            id: { in: qc5Trackings.map((t) => t.unitId) },
            storeReceiptCreated: false,
          },
          include: {
            productionOrder: {
              include: {
                product: {
                  select: { id: true, name: true, productNumber: true, category: true },
                },
                manager: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
        })
      : [];

    const trackingByUnitId = Object.fromEntries(qc5Trackings.map((t) => [t.unitId, t]));

    const pendingUnits = productionUnits.map((u) => ({
      ...u,
      itemType: 'production_unit' as const,
      qc5CompletedAt: trackingByUnitId[u.id]?.completedAt ?? null,
      qc5CompletedBy: trackingByUnitId[u.id]?.completedBy ?? null,
    }));

    // ── 2. Return units: all repair tasks done + not yet in store ──
    const pendingReturns = await prisma.productReturn.findMany({
      where: {
        status: 'REPAIR_COMPLETED',
        storeReceiptCreated: false,
      },
      include: {
        customer: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, productNumber: true, category: true } },
        repairTasks: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, name: true, status: true, completedAt: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const pendingReturnItems = pendingReturns.map((r) => ({
      ...r,
      itemType: 'return' as const,
    }));

    return NextResponse.json({ pendingUnits, pendingReturns: pendingReturnItems });
  } catch (error) {
    console.error('Error fetching pending production receipts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending production receipts' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['ADMIN', 'STORE_KEEPER', 'OPERATION_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, unitId, returnId } = body;

    // ── A. Receive a production unit ────────────────────────────
    if (type === 'unit' || unitId) {
      const id = unitId;
      if (!id) return NextResponse.json({ error: 'unitId is required' }, { status: 400 });

      const unit = await prisma.productionUnit.findUnique({
        where: { id },
        include: {
          productionOrder: {
            include: {
              product: { select: { id: true, name: true, productNumber: true, category: true } },
            },
          },
        },
      });

      if (!unit) return NextResponse.json({ error: 'Production unit not found' }, { status: 404 });
      if (unit.storeReceiptCreated) {
        return NextResponse.json({ error: 'Unit already received into store' }, { status: 400 });
      }

      const product = unit.productionOrder?.product;
      const order = unit.productionOrder;
      if (!product || !order) {
        return NextResponse.json(
          { error: 'Unit is not linked to a production order with a product' },
          { status: 400 },
        );
      }

      const storeItem = await findOrCreateStoreItem(product);
      const receiptNumber = await generateReceiptNumber();

      const receipt = await prisma.$transaction(async (tx) => {
        const newReceipt = await tx.storeReceipt.create({
          data: {
            receiptNumber,
            source: 'Production',
            referenceNumber: order.orderNumber,
            items: [
              {
                storeItemId: storeItem.id,
                itemNumber: storeItem.itemNumber,
                name: storeItem.name,
                unit: storeItem.unit,
                quantity: 1,
                batchNumber: null,
                notes: `Unit ${unit.unitId} from production order ${order.orderNumber}`,
              },
            ],
            receivedBy: session.user.name as string,
            notes: `Received unit ${unit.unitId} from production order ${order.orderNumber}`,
          },
        });

        await tx.storeItem.update({
          where: { id: storeItem.id },
          data: { quantity: { increment: 1 } },
        });

        await tx.productionUnit.update({
          where: { id },
          data: { storeReceiptCreated: true },
        });

        return newReceipt;
      });

      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'Received Production Unit into Store',
          module: 'Store',
          details: {
            receiptNumber: receipt.receiptNumber,
            unitId: unit.unitId,
            productionOrderNumber: order.orderNumber,
            productName: product.name,
            storeItemId: storeItem.id,
          },
        },
      });

      return NextResponse.json(receipt, { status: 201 });
    }

    // ── B. Receive a returned/repaired unit ─────────────────────
    if (type === 'return' || returnId) {
      const id = returnId;
      if (!id) return NextResponse.json({ error: 'returnId is required' }, { status: 400 });

      const productReturn = await prisma.productReturn.findUnique({
        where: { id },
        include: {
          product: { select: { id: true, name: true, productNumber: true, category: true } },
          customer: { select: { id: true, name: true } },
        },
      });

      if (!productReturn) return NextResponse.json({ error: 'Return not found' }, { status: 404 });
      if (productReturn.storeReceiptCreated) {
        return NextResponse.json({ error: 'Return already received into store' }, { status: 400 });
      }
      if (productReturn.status !== 'REPAIR_COMPLETED') {
        return NextResponse.json({ error: 'Return is not yet repair-complete' }, { status: 400 });
      }

      const { product } = productReturn;
      if (!product) {
        return NextResponse.json({ error: 'Return has no linked product' }, { status: 400 });
      }

      const storeItem = await findOrCreateStoreItem(product);
      const receiptNumber = await generateReceiptNumber();

      const receipt = await prisma.$transaction(async (tx) => {
        const newReceipt = await tx.storeReceipt.create({
          data: {
            receiptNumber,
            source: 'Return',
            referenceNumber: productReturn.returnNumber,
            items: [
              {
                storeItemId: storeItem.id,
                itemNumber: storeItem.itemNumber,
                name: storeItem.name,
                unit: storeItem.unit,
                quantity: 1,
                batchNumber: null,
                notes: `Repaired return ${productReturn.returnNumber} — unit ${productReturn.unitId ?? 'N/A'}`,
              },
            ],
            receivedBy: session.user.name as string,
            notes: `Received repaired unit from return ${productReturn.returnNumber}`,
          },
        });

        await tx.storeItem.update({
          where: { id: storeItem.id },
          data: { quantity: { increment: 1 } },
        });

        await tx.productReturn.update({
          where: { id },
          data: { storeReceiptCreated: true, status: 'READY_FOR_DISPATCH' },
        });

        return newReceipt;
      });

      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'Received Repaired Return Unit into Store',
          module: 'Store',
          details: {
            receiptNumber: receipt.receiptNumber,
            returnNumber: productReturn.returnNumber,
            productName: product.name,
            storeItemId: storeItem.id,
          },
        },
      });

      return NextResponse.json(receipt, { status: 201 });
    }

    return NextResponse.json({ error: 'type must be "unit" or "return"' }, { status: 400 });
  } catch (error) {
    console.error('Error receiving into store:', error);
    return NextResponse.json({ error: 'Failed to receive into store' }, { status: 500 });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function findOrCreateStoreItem(product: {
  id: string;
  name: string;
  category: string;
}) {
  let storeItem = await prisma.storeItem.findFirst({
    where: { productId: product.id, isActive: true },
  });

  if (!storeItem) {
    const lastStoreItem = await prisma.storeItem.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { itemNumber: true },
    });
    const itemCount = lastStoreItem
      ? parseInt(lastStoreItem.itemNumber.split('-')[1]) + 1
      : 1;

    storeItem = await prisma.storeItem.create({
      data: {
        itemNumber: `STK-${itemCount.toString().padStart(4, '0')}`,
        name: product.name,
        productId: product.id,
        category: product.category,
        quantity: 0,
        unit: 'pcs',
        condition: 'NEW',
      },
    });
  }

  return storeItem;
}

async function generateReceiptNumber(): Promise<string> {
  const lastReceipt = await prisma.storeReceipt.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { receiptNumber: true },
  });
  const receiptCount = lastReceipt
    ? parseInt(lastReceipt.receiptNumber.split('-')[2]) + 1
    : 1;
  return `SRN-${new Date().getFullYear()}-${receiptCount.toString().padStart(4, '0')}`;
}
