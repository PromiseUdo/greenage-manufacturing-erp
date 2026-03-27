// app/api/production/orders/[id]/material-requisition/[reqId]/route.ts
// PATCH – Inventory team fulfills a requisition: records issued quantities,
//         deducts stock from Material, creates MaterialIssuance records,
//         auto-completes P-1 if fully fulfilled

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reqId: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: orderId, reqId } = await params;
    const body = await request.json();

    // body.items = [{ itemId, quantityIssued, notes }]
    // body.inventoryNotes = string (optional)
    // body.cancel = boolean (optional – to cancel the requisition)
    const { items, inventoryNotes, cancel } = body;

    const requisition = await prisma.productionMaterialRequisition.findUnique({
      where: { id: reqId },
      include: {
        items: {
          include: {
            material: { select: { id: true, name: true, unit: true, currentStock: true } },
          },
        },
        productionOrder: { select: { id: true, orderNumber: true, quantity: true } },
      },
    });

    if (!requisition) {
      return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });
    }
    if (requisition.productionOrderId !== orderId) {
      return NextResponse.json({ error: 'Requisition does not belong to this order' }, { status: 403 });
    }
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

    // Process each item fulfillment
    const updatePromises: Promise<any>[] = [];
    const issuancePromises: Promise<any>[] = [];

    for (const itemUpdate of items as { itemId: string; quantityIssued: number; notes?: string }[]) {
      const existingItem = requisition.items.find((i) => i.id === itemUpdate.itemId);
      if (!existingItem) continue;

      const newlyIssued = Math.max(0, itemUpdate.quantityIssued ?? 0);
      const previouslyIssued = existingItem.quantityIssued || 0;
      const totalIssued = previouslyIssued + newlyIssued;
      const required = existingItem.quantityRequired;

      let itemStatus = 'PENDING';
      if (totalIssued === 0) {
        itemStatus = 'UNAVAILABLE';
      } else if (totalIssued >= required) {
        itemStatus = 'ISSUED';
      } else {
        itemStatus = 'PARTIAL';
      }

      // Update item record with new total and status
      updatePromises.push(
        prisma.productionMaterialRequisitionItem.update({
          where: { id: itemUpdate.itemId },
          data: {
            quantityIssued: totalIssued,
            status: itemStatus,
            notes: itemUpdate.notes || null,
          },
        })
      );

      // Deduct from stock ONLY the newly issued amount
      if (newlyIssued > 0) {
        updatePromises.push(
          prisma.material.update({
            where: { id: existingItem.materialId },
            data: { currentStock: { decrement: newlyIssued } },
          })
        );

        // Create MaterialIssuance record for audit trail tracking the exact newly issued amount
        issuancePromises.push(
          prisma.materialIssuance.create({
            data: {
              materialId: existingItem.materialId,
              orderId: orderId,
              quantity: newlyIssued,
              batchNumber: `MRQ-${requisition.requisitionNumber}`,
              issuedTo: `Production Order ${requisition.productionOrder?.orderNumber || 'N/A'}`,
              issuedBy: session.user.name as string,
              purpose: `BOM material sign-out for production order ${requisition.productionOrder?.orderNumber || 'N/A'}`,
            },
          })
        );
      }
    }

    await Promise.all([...updatePromises, ...issuancePromises]);

    // Re-fetch items to compute new overall status
    const updatedItems = await prisma.productionMaterialRequisitionItem.findMany({
      where: { requisitionId: reqId },
    });

    let newStatus: 'PENDING' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED' = 'PENDING';
    const allIssued = updatedItems.every((i) => i.status === 'ISSUED');
    const anyIssued = updatedItems.some((i) => i.status === 'ISSUED' || i.status === 'PARTIAL');
    const anyUnavailable = updatedItems.some((i) => i.status === 'UNAVAILABLE');

    if (allIssued) {
      newStatus = 'FULFILLED';
    } else if (anyIssued) {
      newStatus = 'PARTIALLY_FULFILLED';
    }

    await prisma.productionMaterialRequisition.update({
      where: { id: reqId },
      data: {
        status: newStatus,
        inventoryNotes: inventoryNotes || null,
        fulfilledById: session.user.id,
        fulfilledAt: newStatus === 'FULFILLED' ? new Date() : null,
      },
    });

    // If fully fulfilled, auto-complete P-1 unit step trackings
    if (newStatus === 'FULFILLED') {
      await prisma.unitStepTracking.updateMany({
        where: {
          actionItem: {
            stepId: 'P-1',
            stageEntry: { productionOrderId: orderId },
          },
          status: { not: 'COMPLETED' },
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completedById: session.user.id,
          notes: `All BOM materials signed out via requisition ${requisition.requisitionNumber}`,
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: `Fulfilled Material Requisition ${requisition.requisitionNumber} — P-1 auto-completed`,
          module: 'Inventory',
          details: {
            orderId,
            orderNumber: requisition.productionOrder?.orderNumber,
            requisitionNumber: requisition.requisitionNumber,
            itemsIssued: updatedItems.filter((i) => i.status === 'ISSUED').length,
            totalItems: updatedItems.length,
          },
        },
      });
    } else if (anyIssued) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: `Partially Fulfilled Material Requisition ${requisition.requisitionNumber}`,
          module: 'Inventory',
          details: {
            orderId,
            requisitionNumber: requisition.requisitionNumber,
            issuedCount: updatedItems.filter((i) => i.status === 'ISSUED').length,
            partialCount: updatedItems.filter((i) => i.status === 'PARTIAL').length,
            unavailableCount: updatedItems.filter((i) => i.status === 'UNAVAILABLE').length,
          },
        },
      });
    }

    const finalRequisition = await prisma.productionMaterialRequisition.findUnique({
      where: { id: reqId },
      include: {
        requestedBy: { select: { id: true, name: true } },
        fulfilledBy: { select: { id: true, name: true } },
        items: {
          include: {
            material: {
              select: { id: true, name: true, partNumber: true, unit: true, currentStock: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return NextResponse.json(finalRequisition);
  } catch (error) {
    console.error('Error fulfilling material requisition:', error);
    return NextResponse.json({ error: 'Failed to fulfill requisition' }, { status: 500 });
  }
}
