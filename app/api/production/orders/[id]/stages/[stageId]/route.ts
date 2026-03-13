// app/api/production/orders/[id]/stages/[stageId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, stageId } = await params;
    const body = await request.json();
    const { status, responsibleId, scheduledStart, scheduledEnd } = body;

    // Verify production order exists
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      select: { id: true, status: true, orderNumber: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Production order not found' },
        { status: 404 }
      );
    }

    // Verify stage exists and belongs to this order
    const stage = await prisma.productionStageEntry.findFirst({
      where: { id: stageId, productionOrderId: id },
      include: {
        actionItems: { select: { id: true, status: true } },
      },
    });

    if (!stage) {
      return NextResponse.json(
        { error: 'Stage not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;

      if (status === 'IN_PROGRESS' && !stage.actualStart) {
        updateData.actualStart = new Date();
      }
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
        updateData.completedById = session.user.id;
        updateData.actualEnd = new Date();
      }
    }

    if (responsibleId !== undefined) {
      updateData.responsibleId = responsibleId || null;
    }
    if (scheduledStart) updateData.scheduledStart = new Date(scheduledStart);
    if (scheduledEnd) updateData.scheduledEnd = new Date(scheduledEnd);

    const updatedStage = await prisma.productionStageEntry.update({
      where: { id: stageId },
      data: updateData,
      include: {
        responsible: {
          select: { id: true, name: true, email: true },
        },
        actionItems: {
          include: {
            responsible: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: { activities: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // If stage completed, check if all stages are done → auto-complete order
    if (status === 'COMPLETED') {
      const allStages = await prisma.productionStageEntry.findMany({
        where: { productionOrderId: id },
        select: { status: true },
      });

      const allCompleted = allStages.every((s) => s.status === 'COMPLETED');
      if (allCompleted) {
        await prisma.productionOrder.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            actualEnd: new Date(),
          },
        });
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `Updated Stage: ${updatedStage.stageLabel}${status ? ` → ${status}` : ''}`,
        module: 'Production',
        details: {
          orderId: id,
          orderNumber: order.orderNumber,
          stageId,
          stageName: updatedStage.stageName,
          changes: body,
        },
      },
    });

    return NextResponse.json(updatedStage);
  } catch (error) {
    console.error('Error updating production stage:', error);
    return NextResponse.json(
      { error: 'Failed to update production stage' },
      { status: 500 }
    );
  }
}
