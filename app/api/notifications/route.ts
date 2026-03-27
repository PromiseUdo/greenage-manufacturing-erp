// app/api/notifications/route.ts
// Aggregates actionable notifications across modules.
// Inventory: PENDING / PARTIALLY_FULFILLED material requisitions
// Production: RECEIVED product returns (newly logged by inventory, awaiting production action)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [requisitions, productReturns] = await Promise.all([
      // ── Inventory: pending material requisitions ──────────────────────────
      prisma.productionMaterialRequisition.findMany({
        where: { status: { in: ['PENDING', 'PARTIALLY_FULFILLED'] } },
        include: {
          productionOrder: {
            select: { orderNumber: true, product: { select: { name: true } } },
          },
          productReturn: {
            select: { returnNumber: true, product: { select: { name: true } } },
          },
          requestedBy: { select: { name: true } },
          items: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),

      // ── Production: newly received product returns ────────────────────────
      prisma.productReturn.findMany({
        where: { status: 'RECEIVED' },
        include: {
          product: { select: { name: true, productNumber: true } },
          customer: { select: { name: true } },
          receivedBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    // ── Map material requisitions ─────────────────────────────────────────
    const requisitionNotifs = requisitions.map((req) => {
      const orderRef =
        req.productionOrder?.orderNumber ?? req.productReturn?.returnNumber ?? 'Unknown';
      const productName =
        req.productionOrder?.product?.name ??
        req.productReturn?.product?.name ??
        'Unknown Product';
      const isPartial = req.status === 'PARTIALLY_FULFILLED';

      return {
        id: req.id,
        type: 'MATERIAL_REQUISITION' as const,
        module: 'INVENTORY' as const,
        title: isPartial ? 'Partial Fulfillment Needed' : 'New Material Request',
        message: `${req.requisitionNumber} · ${productName}`,
        subtext: `${orderRef} · Requested by ${req.requestedBy?.name ?? 'Unknown'}`,
        status: req.status,
        createdAt: req.createdAt.toISOString(),
        link: '/inventory/production-requests',
        meta: {
          requisitionNumber: req.requisitionNumber,
          productName,
          orderNumber: orderRef,
          itemCount: req.items.length,
          requestedBy: req.requestedBy?.name ?? 'Unknown',
        },
      };
    });

    // ── Map product returns ───────────────────────────────────────────────
    const returnNotifs = productReturns.map((ret) => ({
      id: ret.id,
      type: 'PRODUCT_RETURN' as const,
      module: 'PRODUCTION' as const,
      title: 'New Product Return',
      message: `${ret.returnNumber} · ${ret.product.name}`,
      subtext: `From ${ret.customer.name} · Received by ${ret.receivedBy?.name ?? 'Unknown'}`,
      status: ret.status,
      createdAt: ret.createdAt.toISOString(),
      link: '/production/returns',
      meta: {
        returnNumber: ret.returnNumber,
        productName: ret.product.name,
        productNumber: ret.product.productNumber,
        customerName: ret.customer.name,
        condition: ret.condition ?? null,
        issueReported: ret.issueReported,
        receivedBy: ret.receivedBy?.name ?? 'Unknown',
      },
    }));

    // ── Merge, newest first ───────────────────────────────────────────────
    const notifications = [...requisitionNotifs, ...returnNotifs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return NextResponse.json({ notifications, totalCount: notifications.length });
  } catch (error) {
    console.error('[notifications] fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
