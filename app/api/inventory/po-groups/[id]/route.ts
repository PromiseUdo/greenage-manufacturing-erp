import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const group = await prisma.purchaseOrderGroup.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          include: {
            supplier: true,
            payments: true,
            grn: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Compute stats
    const pos = group.purchaseOrders;
    const totalPOs = pos.length;
    const completedPOs = pos.filter((po) => po.status === 'COMPLETED').length;
    const cancelledPOs = pos.filter((po) => po.status === 'CANCELLED').length;
    const activePOs = pos.filter(
      (po) => !['COMPLETED', 'CANCELLED', 'DRAFT'].includes(po.status),
    ).length;
    const draftPOs = pos.filter((po) => po.status === 'DRAFT').length;
    const totalAmount = pos.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    const totalPaid = pos.reduce((sum, po) => sum + (po.paidAmount || 0), 0);
    const completionPct =
      totalPOs > 0 ? Math.round((completedPOs / totalPOs) * 100) : 0;

    let overallStatus: string = 'EMPTY';
    if (totalPOs > 0) {
      if (completedPOs === totalPOs) overallStatus = 'COMPLETED';
      else if (cancelledPOs === totalPOs) overallStatus = 'CANCELLED';
      else if (activePOs > 0 || completedPOs > 0) overallStatus = 'IN_PROGRESS';
      else overallStatus = 'DRAFT';
    }

    // Helper: pick the latest date from a list of nullable Date/string values
    const latestDate = (dates: (Date | string | null | undefined)[]) => {
      const valid = dates
        .map((d) => (d ? new Date(d) : null))
        .filter((d): d is Date => d !== null && !isNaN(d.getTime()));
      return valid.length > 0 ? valid.reduce((a, b) => (a > b ? a : b)) : null;
    };

    // Derive group date range from POs
    const startDate =
      totalPOs > 0
        ? pos.reduce<Date>(
            (min, po) =>
              new Date(po.createdAt) < min ? new Date(po.createdAt) : min,
            new Date(pos[0].createdAt),
          )
        : null;

    const endDate =
      totalPOs > 0
        ? latestDate(
            pos.flatMap((po) => [
              po.receivingEndDate,
              po.plannedReceivingEndDate,
              po.shipmentEndDate,
              po.plannedShipmentEndDate,
              po.paymentEndDate,
              po.plannedPaymentEndDate,
              po.invoiceEndDate,
              po.plannedInvoiceEndDate,
              po.updatedAt,
            ]),
          )
        : null;

    return NextResponse.json({
      ...group,
      _stats: {
        totalPOs,
        completedPOs,
        cancelledPOs,
        activePOs,
        draftPOs,
        totalAmount,
        totalPaid,
        completionPct,
        overallStatus,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Error fetching PO group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PO group' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // if (
    //   !['ADMIN', 'STORE_KEEPER', 'OPERATION_MANAGER'].includes(
    //     session.user.role
    //   )
    // ) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const { id } = await params;
    const body = await request.json();
    const { name, description, addPurchaseOrderIds, removePurchaseOrderIds } =
      body;

    // Check group exists
    const existing = await prisma.purchaseOrderGroup.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Update group fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined)
      updateData.description = description?.trim() || null;

    if (Object.keys(updateData).length > 0) {
      await prisma.purchaseOrderGroup.update({
        where: { id },
        data: updateData,
      });
    }

    // Add POs to group
    if (addPurchaseOrderIds && addPurchaseOrderIds.length > 0) {
      await prisma.purchaseOrder.updateMany({
        where: { id: { in: addPurchaseOrderIds } },
        data: { groupId: id },
      });
    }

    // Remove POs from group
    if (removePurchaseOrderIds && removePurchaseOrderIds.length > 0) {
      await prisma.purchaseOrder.updateMany({
        where: {
          id: { in: removePurchaseOrderIds },
          groupId: id,
        },
        data: { groupId: null },
      });
    }

    // Return updated group
    const updatedGroup = await prisma.purchaseOrderGroup.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          include: { supplier: true, payments: true, grn: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('Error updating PO group:', error);
    return NextResponse.json(
      { error: 'Failed to update PO group' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // if (!['ADMIN', 'OPERATION_MANAGER'].includes(session.user.role)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const { id } = await params;

    const existing = await prisma.purchaseOrderGroup.findUnique({
      where: { id },
      include: { purchaseOrders: { select: { id: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const poIds = existing.purchaseOrders.map((po) => po.id);

    if (poIds.length > 0) {
      // Delete payments for all POs in the group first
      await prisma.payment.deleteMany({
        where: { purchaseOrderId: { in: poIds } },
      });

      // Delete all POs in the group
      await prisma.purchaseOrder.deleteMany({
        where: { id: { in: poIds } },
      });
    }

    // Delete the group
    await prisma.purchaseOrderGroup.delete({ where: { id } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Deleted PO Group',
        module: 'Inventory',
        details: {
          groupId: id,
          groupNumber: existing.groupNumber,
          name: existing.name,
          deletedPOCount: poIds.length,
        },
      },
    });

    return NextResponse.json({
      message: 'Group and all its POs deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting PO group:', error);
    return NextResponse.json(
      { error: 'Failed to delete PO group' },
      { status: 500 },
    );
  }
}
