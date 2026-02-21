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

    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { groupNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [groups, total] = await Promise.all([
      prisma.purchaseOrderGroup.findMany({
        where,
        include: {
          purchaseOrders: {
            include: {
              supplier: true,
              payments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.purchaseOrderGroup.count({ where }),
    ]);

    // Compute stats for each group
    const enrichedGroups = groups.map((group) => {
      const pos = group.purchaseOrders;
      const totalPOs = pos.length;
      const completedPOs = pos.filter((po) => po.status === 'COMPLETED').length;
      const cancelledPOs = pos.filter((po) => po.status === 'CANCELLED').length;
      const activePOs = pos.filter(
        (po) => !['COMPLETED', 'CANCELLED', 'DRAFT'].includes(po.status)
      ).length;
      const totalAmount = pos.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
      const totalPaid = pos.reduce((sum, po) => sum + (po.paidAmount || 0), 0);
      const completionPct =
        totalPOs > 0 ? Math.round((completedPOs / totalPOs) * 100) : 0;

      // Determine overall group status
      let overallStatus: string = 'EMPTY';
      if (totalPOs > 0) {
        if (completedPOs === totalPOs) overallStatus = 'COMPLETED';
        else if (cancelledPOs === totalPOs) overallStatus = 'CANCELLED';
        else if (activePOs > 0 || completedPOs > 0) overallStatus = 'IN_PROGRESS';
        else overallStatus = 'DRAFT';
      }

      return {
        ...group,
        _stats: {
          totalPOs,
          completedPOs,
          cancelledPOs,
          activePOs,
          totalAmount,
          totalPaid,
          completionPct,
          overallStatus,
        },
      };
    });

    return NextResponse.json({
      groups: enrichedGroups,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching PO groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PO groups' },
      { status: 500 }
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
      !['ADMIN', 'STORE_KEEPER', 'OPERATION_MANAGER'].includes(
        session.user.role
      )
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, purchaseOrderIds } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    // Generate group number
    const lastGroup = await prisma.purchaseOrderGroup.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { groupNumber: true },
    });

    let groupCount = 1;
    if (lastGroup) {
      const parts = lastGroup.groupNumber.split('-');
      groupCount = parseInt(parts[2]) + 1;
    }
    const groupNumber = `POG-${new Date().getFullYear()}-${groupCount
      .toString()
      .padStart(4, '0')}`;

    const group = await prisma.purchaseOrderGroup.create({
      data: {
        groupNumber,
        name: name.trim(),
        description: description?.trim() || null,
        createdBy: session.user.name as string,
      },
      include: {
        purchaseOrders: true,
      },
    });

    // Attach existing POs if provided
    if (purchaseOrderIds && purchaseOrderIds.length > 0) {
      await prisma.purchaseOrder.updateMany({
        where: { id: { in: purchaseOrderIds } },
        data: { groupId: group.id },
      });

      // Re-fetch with POs
      const updatedGroup = await prisma.purchaseOrderGroup.findUnique({
        where: { id: group.id },
        include: {
          purchaseOrders: {
            include: { supplier: true, payments: true },
          },
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'Created PO Group',
          module: 'Inventory',
          details: {
            groupId: group.id,
            groupNumber,
            name: name.trim(),
            poCount: purchaseOrderIds.length,
          },
        },
      });

      return NextResponse.json(updatedGroup, { status: 201 });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Created PO Group',
        module: 'Inventory',
        details: {
          groupId: group.id,
          groupNumber,
          name: name.trim(),
        },
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('Error creating PO group:', error);
    return NextResponse.json(
      { error: 'Failed to create PO group' },
      { status: 500 }
    );
  }
}
