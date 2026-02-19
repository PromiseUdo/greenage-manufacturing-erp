import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { PurchaseOrderStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        grn: {
          include: {
            batches: {
              include: {
                material: true,
              },
            },
          },
        },
      },
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(purchaseOrder);
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase order' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !['ADMIN', 'STORE_KEEPER', 'OPERATION_MANAGER'].includes(
        session.user.role
      )
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    // Build update data from request body
    const updateData: any = {};

    // Allow updating items and totals (Step 1 - Invoice)
    if (body.items !== undefined) updateData.items = body.items;
    if (body.subtotal !== undefined) updateData.subtotal = body.subtotal;
    if (body.tax !== undefined) updateData.tax = body.tax;
    if (body.discount !== undefined) updateData.discount = body.discount;
    if (body.totalAmount !== undefined) updateData.totalAmount = body.totalAmount;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.invoiceDate !== undefined)
      updateData.invoiceDate = body.invoiceDate ? new Date(body.invoiceDate) : null;
    if (body.invoiceStartDate !== undefined)
      updateData.invoiceStartDate = body.invoiceStartDate
        ? new Date(body.invoiceStartDate)
        : null;
    if (body.invoiceEndDate !== undefined)
      updateData.invoiceEndDate = body.invoiceEndDate
        ? new Date(body.invoiceEndDate)
        : null;
    if (body.invoiceNotes !== undefined) updateData.invoiceNotes = body.invoiceNotes;

    // Planning step - Planned dates/details
    if (body.plannedInvoiceStartDate !== undefined)
      updateData.plannedInvoiceStartDate = body.plannedInvoiceStartDate
        ? new Date(body.plannedInvoiceStartDate)
        : null;
    if (body.plannedInvoiceEndDate !== undefined)
      updateData.plannedInvoiceEndDate = body.plannedInvoiceEndDate
        ? new Date(body.plannedInvoiceEndDate)
        : null;
    if (body.plannedPaymentStartDate !== undefined)
      updateData.plannedPaymentStartDate = body.plannedPaymentStartDate
        ? new Date(body.plannedPaymentStartDate)
        : null;
    if (body.plannedPaymentEndDate !== undefined)
      updateData.plannedPaymentEndDate = body.plannedPaymentEndDate
        ? new Date(body.plannedPaymentEndDate)
        : null;
    if (body.plannedShipmentMethod !== undefined)
      updateData.plannedShipmentMethod = body.plannedShipmentMethod;
    if (body.plannedShipmentStartDate !== undefined)
      updateData.plannedShipmentStartDate = body.plannedShipmentStartDate
        ? new Date(body.plannedShipmentStartDate)
        : null;
    if (body.plannedShipmentEndDate !== undefined)
      updateData.plannedShipmentEndDate = body.plannedShipmentEndDate
        ? new Date(body.plannedShipmentEndDate)
        : null;
    if (body.plannedEstimatedArrival !== undefined)
      updateData.plannedEstimatedArrival = body.plannedEstimatedArrival
        ? new Date(body.plannedEstimatedArrival)
        : null;
    if (body.plannedReceivingStartDate !== undefined)
      updateData.plannedReceivingStartDate = body.plannedReceivingStartDate
        ? new Date(body.plannedReceivingStartDate)
        : null;
    if (body.plannedReceivingEndDate !== undefined)
      updateData.plannedReceivingEndDate = body.plannedReceivingEndDate
        ? new Date(body.plannedReceivingEndDate)
        : null;

    // Step 2 - Payment
    if (body.paymentStartDate !== undefined)
      updateData.paymentStartDate = body.paymentStartDate
        ? new Date(body.paymentStartDate)
        : null;
    if (body.paymentEndDate !== undefined)
      updateData.paymentEndDate = body.paymentEndDate
        ? new Date(body.paymentEndDate)
        : null;
    if (body.paymentNotes !== undefined) updateData.paymentNotes = body.paymentNotes;
    if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus;
    if (body.paidAmount !== undefined) updateData.paidAmount = body.paidAmount;

    // Step 3 - Shipment
    if (body.shipmentMethod !== undefined)
      updateData.shipmentMethod = body.shipmentMethod;
    if (body.trackingNumber !== undefined)
      updateData.trackingNumber = body.trackingNumber;
    if (body.estimatedArrival !== undefined)
      updateData.estimatedArrival = body.estimatedArrival
        ? new Date(body.estimatedArrival)
        : null;
    if (body.shipmentStartDate !== undefined)
      updateData.shipmentStartDate = body.shipmentStartDate
        ? new Date(body.shipmentStartDate)
        : null;
    if (body.shipmentEndDate !== undefined)
      updateData.shipmentEndDate = body.shipmentEndDate
        ? new Date(body.shipmentEndDate)
        : null;
    if (body.shipmentNotes !== undefined)
      updateData.shipmentNotes = body.shipmentNotes;

    // Step 4 - Receiving
    if (body.receivingStartDate !== undefined)
      updateData.receivingStartDate = body.receivingStartDate
        ? new Date(body.receivingStartDate)
        : null;
    if (body.receivingEndDate !== undefined)
      updateData.receivingEndDate = body.receivingEndDate
        ? new Date(body.receivingEndDate)
        : null;
    if (body.receivingNotes !== undefined)
      updateData.receivingNotes = body.receivingNotes;
    if (body.receivedItems !== undefined)
      updateData.receivedItems = body.receivedItems;
    if (body.grnId !== undefined) updateData.grnId = body.grnId;

    // Status
    if (body.status !== undefined) updateData.status = body.status;

    // Notes
    if (body.notes !== undefined) updateData.notes = body.notes;

    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        grn: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `Updated Purchase Order (${body.status || existing.status})`,
        module: 'Inventory',
        details: {
          poId: purchaseOrder.id,
          poNumber: purchaseOrder.poNumber,
          status: purchaseOrder.status,
        },
      },
    });

    return NextResponse.json(purchaseOrder);
  } catch (error) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json(
      { error: 'Failed to update purchase order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only DRAFT purchase orders can be deleted' },
        { status: 400 }
      );
    }

    await prisma.purchaseOrder.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Deleted Purchase Order',
        module: 'Inventory',
        details: {
          poNumber: existing.poNumber,
        },
      },
    });

    return NextResponse.json({ message: 'Purchase order deleted' });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    return NextResponse.json(
      { error: 'Failed to delete purchase order' },
      { status: 500 }
    );
  }
}
