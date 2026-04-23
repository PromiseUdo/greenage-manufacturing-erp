import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Returns the unique key for an item — materialId for materials, toolGroupId for tools.
function itemKey(item: any): string {
  return item.materialId || item.toolGroupId || '';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: poId } = await params;
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required and must not be empty' },
        { status: 400 },
      );
    }

    const po = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
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

    // Build cumulative received map keyed by materialId or toolGroupId
    const receivedMap: Record<string, number> = {};
    existingReceived.forEach((r: any) => {
      const key = itemKey(r);
      if (key) receivedMap[key] = (receivedMap[key] || 0) + (r.receivedQty || 0);
    });

    // Validate each incoming item
    for (const item of items) {
      const type = item.itemType || 'material';
      const key = itemKey(item);
      const { quantity } = item;

      if (!key || !quantity || quantity <= 0) {
        return NextResponse.json(
          { error: 'Each item must have a valid id and positive quantity' },
          { status: 400 },
        );
      }

      // Find matching PO line item by key
      const poItem = poItems.find((pi: any) => itemKey(pi) === key);
      if (!poItem) {
        return NextResponse.json(
          { error: `Item ${key} not found in this purchase order` },
          { status: 400 },
        );
      }

      const ordered = poItem.quantity || 0;
      const alreadyReceived = receivedMap[key] || 0;
      const remaining = ordered - alreadyReceived;

      if (quantity > remaining) {
        const name =
          type === 'tool'
            ? item.toolGroupName || key
            : item.materialName || key;
        return NextResponse.json(
          {
            error: `Cannot receive ${quantity} of "${name}". Only ${remaining} remaining.`,
          },
          { status: 400 },
        );
      }
    }

    // Execute in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const type = item.itemType || 'material';

        if (type === 'tool') {
          // Increment ToolGroup totalQuantity and availableQuantity
          await tx.toolGroup.update({
            where: { id: item.toolGroupId },
            data: {
              totalQuantity: { increment: item.quantity },
              availableQuantity: { increment: item.quantity },
            },
          });
        } else {
          // Material path: create batch record + increment currentStock
          const lastBatch = await tx.materialBatch.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { batchNumber: true },
          });

          let batchSeq = 1;
          if (lastBatch?.batchNumber) {
            const parts = lastBatch.batchNumber.split('-');
            const lastNum = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastNum)) batchSeq = lastNum + 1;
          }

          const batchNumber = `RCV-${new Date().getFullYear()}-${batchSeq
            .toString()
            .padStart(5, '0')}`;

          await tx.materialBatch.create({
            data: {
              materialId: item.materialId,
              batchNumber,
              quantity: item.quantity,
              receivedDate: new Date(),
            },
          });

          await tx.material.update({
            where: { id: item.materialId },
            data: { currentStock: { increment: item.quantity } },
          });
        }
      }

      // Append receipt entries to PO.receivedItems
      const newEntries = items.map((item: any) => {
        const type = item.itemType || 'material';
        return type === 'tool'
          ? {
              itemType: 'tool',
              toolGroupId: item.toolGroupId,
              toolGroupName: item.toolGroupName || '',
              groupNumber: item.groupNumber || '',
              receivedQty: item.quantity,
              receivedAt: new Date().toISOString(),
            }
          : {
              itemType: 'material',
              materialId: item.materialId,
              materialName: item.materialName || '',
              receivedQty: item.quantity,
              receivedAt: new Date().toISOString(),
            };
      });

      const updatedReceivedItems = [...existingReceived, ...newEntries];

      return tx.purchaseOrder.update({
        where: { id: poId },
        data: { receivedItems: updatedReceivedItems },
        include: {
          supplier: true,
          payments: { orderBy: { paymentDate: 'desc' } },
          grn: {
            include: { batches: { include: { material: true } } },
          },
        },
      });
    });

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
            itemType: i.itemType || 'material',
            id: itemKey(i),
            name: i.materialName || i.toolGroupName,
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
