// app/api/store/dispatches/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const customerId = searchParams.get('customerId') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const deliveryMethod = searchParams.get('deliveryMethod') || '';
    const isExport = searchParams.get('export') === 'true';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { dispatchNumber: { contains: search, mode: 'insensitive' } },
        { dispatchedBy: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (deliveryMethod) {
      where.deliveryMethod = deliveryMethod;
    }

    if (dateFrom || dateTo) {
      where.dispatchDate = {};
      if (dateFrom) where.dispatchDate.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.dispatchDate.lte = end;
      }
    }

    const queryOptions = {
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' as const },
    };

    // Export mode: return all matching records without pagination
    if (isExport) {
      const dispatches = await prisma.storeDispatch.findMany(queryOptions);
      return NextResponse.json({ dispatches });
    }

    const [dispatches, total] = await Promise.all([
      prisma.storeDispatch.findMany({ ...queryOptions, skip, take: limit }),
      prisma.storeDispatch.count({ where }),
    ]);

    return NextResponse.json({
      dispatches,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching store dispatches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store dispatches' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !['ADMIN', 'STORE_KEEPER', 'OPERATION_MANAGER', 'DISPATCH_OFFICER'].includes(
        session.user.role,
      )
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { customerId, invoiceId, orderId, dispatchDate, items, deliveryMethod, deliveryAddress, notes, status } = body;

    if (!customerId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer and at least one item are required' },
        { status: 400 },
      );
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, name: true },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 400 },
      );
    }

    // Verify invoice is PAID (if provided)
    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        select: { id: true, status: true, invoiceNumber: true },
      });

      if (!invoice) {
        return NextResponse.json(
          { error: 'Invoice not found' },
          { status: 400 },
        );
      }

      if (invoice.status !== 'PAID' && invoice.status !== 'PARTIALLY_PAID') {
        return NextResponse.json(
          { error: `Invoice ${invoice.invoiceNumber} is not fully or partially paid (status: ${invoice.status})` },
          { status: 400 },
        );
      }
    }

    // Generate dispatch number
    const lastDispatch = await prisma.storeDispatch.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { dispatchNumber: true },
    });

    const dispatchCount = lastDispatch
      ? parseInt(lastDispatch.dispatchNumber.split('-')[2]) + 1
      : 1;
    const dispatchNumber = `DSP-${new Date().getFullYear()}-${dispatchCount
      .toString()
      .padStart(4, '0')}`;

    // Build item snapshots and validate stock
    const itemSnapshots: Array<{
      storeItemId: string;
      itemNumber: string;
      name: string;
      unit: string;
      quantity: number;
      notes: string | null;
    }> = [];

    for (const item of items) {
      const storeItem = await prisma.storeItem.findUnique({
        where: { id: item.storeItemId },
        select: { id: true, name: true, itemNumber: true, unit: true, quantity: true },
      });

      if (!storeItem) {
        return NextResponse.json(
          { error: `Store item not found: ${item.storeItemId}` },
          { status: 400 },
        );
      }

      if (storeItem.quantity < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${storeItem.name}" (${storeItem.itemNumber}). Available: ${storeItem.quantity}, requested: ${item.quantity}`,
          },
          { status: 400 },
        );
      }

      itemSnapshots.push({
        storeItemId: storeItem.id,
        itemNumber: storeItem.itemNumber,
        name: storeItem.name,
        unit: storeItem.unit,
        quantity: item.quantity,
        notes: item.notes || null,
      });
    }

    // Create dispatch and decrement stock in transaction
    const dispatch = await prisma.$transaction(async (tx) => {
      const newDispatch = await tx.storeDispatch.create({
        data: {
          dispatchNumber,
          customerId,
          invoiceId: invoiceId || null,
          orderId: orderId || null,
          dispatchDate: dispatchDate ? new Date(dispatchDate) : new Date(),
          items: itemSnapshots,
          dispatchedBy: session.user.name as string,
          deliveryMethod: deliveryMethod || null,
          deliveryAddress: deliveryAddress || null,
          notes: notes || null,
          status: status || 'PENDING',
        },
        include: {
          customer: {
            select: { id: true, name: true },
          },
        },
      });

      // Decrement each store item's quantity ONLY if it's an actual fulfillment or pending dispatch, not just a bare request
      if (status !== 'REQUESTED') {
        for (const item of items) {
          await tx.storeItem.update({
            where: { id: item.storeItemId },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      return newDispatch;
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Created Store Dispatch',
        module: 'Store',
        details: {
          dispatchId: dispatch.id,
          dispatchNumber,
          customerName: customer.name,
          itemCount: items.length,
        },
      },
    });

    return NextResponse.json(dispatch, { status: 201 });
  } catch (error) {
    console.error('Error creating store dispatch:', error);
    return NextResponse.json(
      { error: 'Failed to create store dispatch' },
      { status: 500 },
    );
  }
}
