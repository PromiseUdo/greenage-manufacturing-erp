import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // if (!['ADMIN', 'STORE_KEEPER'].includes(session.user.role)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const { id: poId } = await params;
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required and must not be empty' },
        { status: 400 },
      );
    }

    // Fetch the PO to validate quantities
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
    });

    if (!po) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 },
      );
    }

    const poItems: any[] = Array.isArray(po.items) ? (po.items as any[]) : [];
    const existingReceived: any[] = Array.isArray(po.receivedItems)
      ? (po.receivedItems as any[])
      : [];

    // Build cumulative received map
    const receivedMap: Record<string, number> = {};
    existingReceived.forEach((r: any) => {
      receivedMap[r.materialId] =
        (receivedMap[r.materialId] || 0) + (r.receivedQty || 0);
    });

    // Validate each item
    for (const item of items) {
      const { materialId, quantity } = item;
      if (!materialId || !quantity || quantity <= 0) {
        return NextResponse.json(
          { error: `Invalid item: materialId and positive quantity required` },
          { status: 400 },
        );
      }

      // Find matching PO line item
      const poItem = poItems.find((pi: any) => pi.materialId === materialId);
      if (!poItem) {
        return NextResponse.json(
          { error: `Material ${materialId} not found in this purchase order` },
          { status: 400 },
        );
      }

      const ordered = poItem.quantity || 0;
      const alreadyReceived = receivedMap[materialId] || 0;
      const remaining = ordered - alreadyReceived;

      if (quantity > remaining) {
        return NextResponse.json(
          {
            error: `Cannot receive ${quantity} of ${item.materialName || materialId}. Only ${remaining} remaining.`,
          },
          { status: 400 },
        );
      }
    }

    // Execute everything in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create MaterialBatch + update Material.currentStock for each item
      for (const item of items) {
        const { materialId, quantity, materialName } = item;

        // Generate a unique batch number
        const lastBatch = await tx.materialBatch.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { batchNumber: true },
        });

        let batchSeq = 1;
        if (lastBatch && lastBatch.batchNumber) {
          const parts = lastBatch.batchNumber.split('-');
          const lastNum = parseInt(parts[parts.length - 1]);
          if (!isNaN(lastNum)) batchSeq = lastNum + 1;
        }

        const batchNumber = `RCV-${new Date().getFullYear()}-${batchSeq
          .toString()
          .padStart(5, '0')}`;

        // Create batch record
        await tx.materialBatch.create({
          data: {
            materialId,
            batchNumber,
            quantity,
            receivedDate: new Date(),
          },
        });

        // Increment material stock
        await tx.material.update({
          where: { id: materialId },
          data: {
            currentStock: {
              increment: quantity,
            },
          },
        });
      }

      // 2. Append receipt entries to PO's receivedItems
      const newReceiptEntries = items.map((item: any) => ({
        materialId: item.materialId,
        materialName: item.materialName || '',
        receivedQty: item.quantity,
        receivedAt: new Date().toISOString(),
      }));

      const updatedReceivedItems = [...existingReceived, ...newReceiptEntries];

      // 3. Update the PO
      const updatedPO = await tx.purchaseOrder.update({
        where: { id: poId },
        data: {
          receivedItems: updatedReceivedItems,
        },
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

      return updatedPO;
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Received Items',
        module: 'Inventory',
        details: {
          poId,
          poNumber: po.poNumber,
          itemCount: items.length,
          items: items.map((i: any) => ({
            materialId: i.materialId,
            materialName: i.materialName,
            quantity: i.quantity,
          })),
        },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error receiving items:', error);
    return NextResponse.json(
      { error: 'Failed to receive items and update inventory' },
      { status: 500 },
    );
  }
}
