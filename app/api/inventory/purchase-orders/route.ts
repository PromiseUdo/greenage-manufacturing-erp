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
    const supplierId = searchParams.get('supplierId') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;
    const where: any = {};

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (status) {
      where.status = status;
    }

    const ungrouped = searchParams.get('ungrouped');
    if (ungrouped === 'true') {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [{ groupId: null }, { groupId: { isSet: false } }],
        },
      ];
    }

    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: true,
          grn: true,
          payments: true,
          group: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return NextResponse.json({
      purchaseOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase orders' },
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

    // if (
    //   !['ADMIN', 'STORE_KEEPER', 'OPERATION_MANAGER'].includes(
    //     session.user.role
    //   )
    // ) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const body = await request.json();
    const { supplierId, items, currency, tax, discount, notes, groupId } = body;

    if (!supplierId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Supplier and at least one item are required' },
        { status: 400 },
      );
    }

    // Validate each item has the required id field for its type
    for (const item of items) {
      const type = item.itemType || 'material';
      if (type === 'tool' && !item.toolGroupId) {
        return NextResponse.json(
          { error: 'Tool items require a toolGroupId' },
          { status: 400 },
        );
      }
      if (type === 'material' && !item.materialId) {
        return NextResponse.json(
          { error: 'Material items require a materialId' },
          { status: 400 },
        );
      }
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + (item.quantity * item.unitCost || 0),
      0,
    );
    const totalAmount = subtotal + (tax || 0) - (discount || 0);

    // Generate PO number
    const lastPO = await prisma.purchaseOrder.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { poNumber: true },
    });

    let poCount = 1;
    if (lastPO) {
      const parts = lastPO.poNumber.split('-');
      poCount = parseInt(parts[2]) + 1;
    }
    const poNumber = `PO-${new Date().getFullYear()}-${poCount
      .toString()
      .padStart(4, '0')}`;

    // Enrich items with totalCost and ensure itemType is persisted
    const enrichedItems = items.map((item: any) => ({
      ...item,
      itemType: item.itemType || 'material',
      totalCost: item.quantity * item.unitCost,
    }));

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        items: enrichedItems,
        subtotal,
        tax: tax || 0,
        discount: discount || 0,
        totalAmount,
        currency: currency || 'NGN',
        notes,
        createdBy: session.user.name as string,
        invoiceDate: new Date(),
        invoiceStartDate: new Date(),
        ...(groupId ? { groupId } : {}),
      },
      include: {
        supplier: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Created Purchase Order',
        module: 'Inventory',
        details: {
          poId: purchaseOrder.id,
          poNumber,
          supplierId,
          itemCount: items.length,
          totalAmount,
        },
      },
    });

    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json(
      { error: 'Failed to create purchase order' },
      { status: 500 },
    );
  }
}
