// app/api/production/orders/[id]/timeline/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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

    // Verify order exists
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      select: { id: true, orderNumber: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Production order not found' },
        { status: 404 }
      );
    }

    // MongoDB doesn't support JSON path filters in Prisma, so fetch recent
    // Production logs and filter by orderId in application code.
    const allActivities = await prisma.activityLog.findMany({
      where: {
        module: 'Production',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const activities = allActivities
      .filter((activity) => {
        const details = activity.details as any;
        return details?.orderId === id;
      })
      .slice(0, 100);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching production timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}
