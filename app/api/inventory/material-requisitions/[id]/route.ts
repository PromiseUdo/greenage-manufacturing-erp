// app/api/inventory/material-requisitions/[id]/route.ts
// PATCH – Inventory team fulfills a requisition: records issued quantities,
//         deducts stock from Material, creates MaterialIssuance records.
//         Works for both Production Orders and Returns.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: reqId } = await params;
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
        productReturn: { select: { id: true, returnNumber: true, quantity: true } },
        researchProject: { select: { id: true, projectNumber: true, title: true } },
      },
    }) as any;

    if (!requisition) {
      return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });
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
      const existingItem = requisition.items.find((i: any) => i.id === itemUpdate.itemId);
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
        // If it's a return, we use the return id instead of order id (or we keep orderId null)
        const issuedToRef = requisition.productionOrder
          ? `Production Order ${requisition.productionOrder.orderNumber}`
          : requisition.productReturn
          ? `Product Return ${requisition.productReturn.returnNumber}`
          : requisition.researchProject
          ? `R&D Project ${requisition.researchProject.projectNumber} — ${requisition.researchProject.title}`
          : `Requisition ${requisition.requisitionNumber}`;

        const purposeRef = requisition.productionOrder
          ? `BOM material sign-out for production order ${requisition.productionOrder.orderNumber}`
          : requisition.productReturn
          ? `Repair materials for return ${requisition.productReturn.returnNumber}`
          : requisition.researchProject
          ? `R&D material sign-out for project ${requisition.researchProject.projectNumber}`
          : `Material sign-out for requisition ${requisition.requisitionNumber}`;

        issuancePromises.push(
          prisma.materialIssuance.create({
            data: {
              materialId: existingItem.materialId,
              orderId: requisition.productionOrderId, // this might be null if it's a return
              quantity: newlyIssued,
              batchNumber: `MRQ-${requisition.requisitionNumber}`,
              issuedTo: issuedToRef,
              issuedBy: session.user.name as string,
              purpose: purposeRef,
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
    const allIssued = updatedItems.every((i: any) => i.status === 'ISSUED');
    const anyIssued = updatedItems.some((i: any) => i.status === 'ISSUED' || i.status === 'PARTIAL');
    
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

    // Log Activity
    const detailsObj: any = {
      requisitionNumber: requisition.requisitionNumber,
    };
    if (requisition.productionOrder) {
      detailsObj.orderId = requisition.productionOrderId;
      detailsObj.orderNumber = requisition.productionOrder.orderNumber;
    } else if (requisition.productReturn) {
      detailsObj.returnId = requisition.productReturnId;
      detailsObj.returnNumber = requisition.productReturn.returnNumber;
    }

    if (newStatus === 'FULFILLED') {
      detailsObj.itemsIssued = updatedItems.filter((i: any) => i.status === 'ISSUED').length;
      detailsObj.totalItems = updatedItems.length;

      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: `Fulfilled Material Requisition ${requisition.requisitionNumber}`,
          module: 'Inventory',
          details: detailsObj,
        },
      });
    } else if (anyIssued) {
      detailsObj.issuedCount = updatedItems.filter((i: any) => i.status === 'ISSUED').length;
      detailsObj.partialCount = updatedItems.filter((i: any) => i.status === 'PARTIAL').length;
      detailsObj.unavailableCount = updatedItems.filter((i: any) => i.status === 'UNAVAILABLE').length;

      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: `Partially Fulfilled Material Requisition ${requisition.requisitionNumber}`,
          module: 'Inventory',
          details: detailsObj,
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
