// app/api/production/orders/[id]/qc-entries/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const order = await prisma.productionOrder.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Production order not found' }, { status: 404 });
    }

    const qcEntries = await prisma.productionQCEntry.findMany({
      where: { productionOrderId: id },
      include: {
        recordedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Compute running totals
    const totals = qcEntries.reduce(
      (acc, entry) => ({
        totalInspected: acc.totalInspected + entry.quantityInspected,
        totalPassed: acc.totalPassed + entry.quantityPassed,
        totalFailed: acc.totalFailed + entry.quantityFailed,
        totalReworked: acc.totalReworked + entry.quantityReworked,
      }),
      { totalInspected: 0, totalPassed: 0, totalFailed: 0, totalReworked: 0 }
    );

    return NextResponse.json({ qcEntries, totals });
  } catch (error) {
    console.error('Error fetching QC entries:', error);
    return NextResponse.json({ error: 'Failed to fetch QC entries' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const {
      checkpointStepId,
      checkpointName,
      quantityInspected,
      quantityPassed,
      quantityFailed,
      quantityReworked,
      outcome,
      failureCategory,
      failureDetails,
      correctiveAction,
    } = body;

    // Validate
    if (!checkpointStepId || !checkpointName || quantityInspected === undefined) {
      return NextResponse.json(
        { error: 'checkpointStepId, checkpointName and quantityInspected are required' },
        { status: 400 }
      );
    }

    if ((quantityPassed ?? 0) + (quantityFailed ?? 0) > quantityInspected) {
      return NextResponse.json(
        { error: 'quantityPassed + quantityFailed cannot exceed quantityInspected' },
        { status: 400 }
      );
    }

    // Verify order exists
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      select: { id: true, quantity: true, orderNumber: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Production order not found' }, { status: 404 });
    }

    // Create QC entry
    const qcEntry = await prisma.productionQCEntry.create({
      data: {
        productionOrderId: id,
        checkpointStepId,
        checkpointName,
        quantityInspected,
        quantityPassed: quantityPassed ?? 0,
        quantityFailed: quantityFailed ?? 0,
        quantityReworked: quantityReworked ?? 0,
        outcome,
        failureCategory: failureCategory || null,
        failureDetails: failureDetails || null,
        correctiveAction: correctiveAction || null,
        recordedById: session.user.id,
      },
      include: {
        recordedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Re-aggregate all QC entries for this order to update yield fields
    const allEntries = await prisma.productionQCEntry.findMany({
      where: { productionOrderId: id },
      select: {
        quantityPassed: true,
        quantityFailed: true,
        quantityReworked: true,
        checkpointStepId: true,
      },
    });

    // Use final QC-6 entries for definitive pass/fail counts
    // Other entries contribute to rework counts
    const finalEntries = allEntries.filter((e) => e.checkpointStepId === 'QC-6');
    const intermediateFails = allEntries
      .filter((e) => e.checkpointStepId !== 'QC-6')
      .reduce((acc, e) => acc + e.quantityFailed, 0);

    const quantityPassed_total = finalEntries.reduce((acc, e) => acc + e.quantityPassed, 0);
    const quantityRejected_total = finalEntries.reduce((acc, e) => acc + e.quantityFailed, 0);
    const quantityReworked_total = allEntries.reduce((acc, e) => acc + e.quantityReworked, 0) + intermediateFails;
    const yieldRate =
      order.quantity > 0
        ? Math.round((quantityPassed_total / order.quantity) * 1000) / 10
        : null;

    // Update the production order yield fields
    await prisma.productionOrder.update({
      where: { id },
      data: {
        quantityStarted: order.quantity,
        quantityPassed: quantityPassed_total || null,
        quantityRejected: quantityRejected_total || null,
        quantityReworked: quantityReworked_total || null,
        yieldRate: yieldRate,
      },
    });

    // If this is QC-6, also update quantityPackaged
    if (checkpointStepId === 'QC-6' && outcome === 'PASS') {
      await prisma.productionOrder.update({
        where: { id },
        data: { quantityPackaged: quantityPassed ?? 0 },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `Recorded QC Decision at ${checkpointStepId}: ${outcome} (${quantityPassed ?? 0} passed, ${quantityFailed ?? 0} failed)`,
        module: 'Production',
        details: {
          orderId: id,
          orderNumber: order.orderNumber,
          checkpointStepId,
          outcome,
          quantityInspected,
          quantityPassed: quantityPassed ?? 0,
          quantityFailed: quantityFailed ?? 0,
        },
      },
    });

    return NextResponse.json(qcEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating QC entry:', error);
    return NextResponse.json({ error: 'Failed to create QC entry' }, { status: 500 });
  }
}
