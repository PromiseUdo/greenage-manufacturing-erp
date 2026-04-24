import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Returns the unique key for an item — materialId for materials, toolId (or legacy toolGroupId) for tools.
function itemKey(item: any): string {
  return item.materialId || item.toolId || item.toolGroupId || '';
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
          if (item.toolGroupId) {
            // Grouped tool: fetch the group to continue its unit numbering sequence
            const group = await tx.toolGroup.findUnique({
              where: { id: item.toolGroupId },
              select: {
                groupNumber: true,
                totalQuantity: true,
                name: true,
                category: true,
                description: true,
                manufacturer: true,
                unitCost: true,
              },
            });

            if (group) {
              // Create N new individual Tool records continuing from current count
              const toolsToCreate = [];
              for (let i = 0; i < item.quantity; i++) {
                const seqNum = (group.totalQuantity || 0) + i + 1;
                toolsToCreate.push({
                  toolId: `${group.groupNumber}-${String(seqNum).padStart(3, '0')}`,
                  name: group.name,
                  toolGroupId: item.toolGroupId,
                  category: group.category,
                  description: group.description,
                  manufacturer: group.manufacturer,
                  purchaseCost: group.unitCost,
                  status: 'AVAILABLE' as const,
                  condition: 'GOOD' as const,
                });
              }

              await tx.tool.createMany({ data: toolsToCreate });

              // Increment the group's aggregate counters
              await tx.toolGroup.update({
                where: { id: item.toolGroupId },
                data: {
                  totalQuantity: { increment: item.quantity },
                  availableQuantity: { increment: item.quantity },
                },
              });
            }
          } else if (item.toolId) {
            const existingTool = await tx.tool.findUnique({
              where: { id: item.toolId },
              select: {
                name: true,
                category: true,
                description: true,
                manufacturer: true,
                purchaseCost: true,
                condition: true,
                location: true,
                status: true,
                currentStock: true,
              },
            });

            if (existingTool) {
              const isPlaceholder = existingTool.currentStock === 0;

              if (isPlaceholder && item.quantity === 1) {
                // Brand new tool, single unit first receipt — stays standalone
                await tx.tool.update({
                  where: { id: item.toolId },
                  data: {
                    currentStock: 1,
                    status: 'AVAILABLE',
                  },
                });
              } else {
                // Either: placeholder receiving qty > 1, OR existing in-stock tool receiving more
                // Both cases → promote to ToolGroup
                const lastGroup = await tx.toolGroup.findFirst({
                  orderBy: { createdAt: 'desc' },
                  select: { groupNumber: true },
                });
                const groupNum = lastGroup
                  ? parseInt(lastGroup.groupNumber.split('-')[1]) + 1
                  : 1;
                const groupNumber = `TOOLGRP-${String(groupNum).padStart(3, '0')}`;

                // For a placeholder (currentStock=0): total = just the received quantity
                // For existing in-stock (currentStock>0): total = 1 (existing record) + received
                const existingCount = isPlaceholder ? 0 : 1;
                const totalQty = existingCount + item.quantity;
                const existingAvailable =
                  !isPlaceholder && existingTool.status === 'AVAILABLE' ? 1 : 0;
                const availableQty = existingAvailable + item.quantity;

                const newGroup = await tx.toolGroup.create({
                  data: {
                    name: existingTool.name,
                    groupNumber,
                    category: existingTool.category,
                    description: existingTool.description,
                    manufacturer: existingTool.manufacturer,
                    unitCost: existingTool.purchaseCost,
                    totalQuantity: totalQty,
                    availableQuantity: availableQty,
                  },
                });

                if (isPlaceholder) {
                  // Placeholder: repurpose the existing record as the first received unit
                  await tx.tool.update({
                    where: { id: item.toolId },
                    data: {
                      toolGroupId: newGroup.id,
                      toolId: `${groupNumber}-001`,
                      currentStock: 0,
                      status: 'AVAILABLE',
                    },
                  });

                  const toolsToCreate = [];
                  for (let i = 1; i < item.quantity; i++) {
                    toolsToCreate.push({
                      toolId: `${groupNumber}-${String(i + 1).padStart(3, '0')}`,
                      name: existingTool.name,
                      toolGroupId: newGroup.id,
                      category: existingTool.category,
                      description: existingTool.description,
                      manufacturer: existingTool.manufacturer,
                      purchaseCost: existingTool.purchaseCost,
                      condition: existingTool.condition,
                      location: existingTool.location ?? undefined,
                      status: 'AVAILABLE' as const,
                    });
                  }
                  if (toolsToCreate.length > 0) {
                    await tx.tool.createMany({ data: toolsToCreate });
                  }
                } else {
                  // Existing in-stock tool: move into group + add received units
                  await tx.tool.update({
                    where: { id: item.toolId },
                    data: {
                      toolGroupId: newGroup.id,
                      toolId: `${groupNumber}-001`,
                    },
                  });

                  const toolsToCreate = [];
                  for (let i = 0; i < item.quantity; i++) {
                    toolsToCreate.push({
                      toolId: `${groupNumber}-${String(i + 2).padStart(3, '0')}`,
                      name: existingTool.name,
                      toolGroupId: newGroup.id,
                      category: existingTool.category,
                      description: existingTool.description,
                      manufacturer: existingTool.manufacturer,
                      purchaseCost: existingTool.purchaseCost,
                      condition: existingTool.condition,
                      location: existingTool.location ?? undefined,
                      status: 'AVAILABLE' as const,
                    });
                  }
                  await tx.tool.createMany({ data: toolsToCreate });
                }
              }
            }
          }
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
          ? item.toolGroupId
            ? {
                itemType: 'tool',
                toolGroupId: item.toolGroupId,
                toolGroupName: item.toolGroupName || '',
                groupNumber: item.groupNumber || '',
                receivedQty: item.quantity,
                receivedAt: new Date().toISOString(),
              }
            : {
                itemType: 'tool',
                toolId: item.toolId || '',
                toolName: item.toolName || '',
                toolNumber: item.toolNumber || '',
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
