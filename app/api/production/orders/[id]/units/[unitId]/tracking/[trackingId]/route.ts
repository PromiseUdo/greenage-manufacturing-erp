// app/api/production/orders/[id]/units/[unitId]/tracking/[trackingId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { REWORK_GATES, ALL_REWORK_GATED_STEPS } from '@/lib/production-rules';
import { computeProgressPercent, computeScheduleStatus, computeShortfall } from '@/lib/production-utils';

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; unitId: string; trackingId: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      !['ADMIN', 'PRODUCTION_MANAGER', 'OPERATION_MANAGER'].includes(
        session.user.role
      )
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, unitId, trackingId } = await params;
    const body = await request.json();
    const { 
      status, 
      notes,
      decisionOutcome,
      rejectionReason,
      rejectionCategory
    } = body;

    // Verify tracking record exists
    const tracking = await prisma.unitStepTracking.findUnique({
      where: { id: trackingId },
      include: {
        unit: { select: { id: true, unitId: true, productionOrderId: true } },
        actionItem: { select: { id: true, stepId: true, actionName: true } }
      }
    });

    if (!tracking || tracking.unitId !== unitId || tracking.unit.productionOrderId !== id) {
      return NextResponse.json(
        { error: 'Tracking record not found or mismatches route parameters' },
        { status: 404 }
      );
    }

    // Guard: certain steps are locked while an active rework exists — which steps depend on the trigger
    if ((status === 'COMPLETED' || status === 'SKIPPED') && ALL_REWORK_GATED_STEPS.has(tracking.actionItem.stepId)) {
      const activeRework = await prisma.unitRework.findFirst({
        where: { productionUnitId: unitId, status: 'IN_PROGRESS' },
      });
      if (activeRework) {
        const gatedSteps = REWORK_GATES[activeRework.triggeredByStepId ?? 'QC-1'] ?? ['QC-2', 'QC-3', 'QC-4'];
        if (gatedSteps.includes(tracking.actionItem.stepId)) {
          return NextResponse.json(
            { error: `This step is locked while a rework process (Round ${activeRework.round}) is active. Complete the rework first.` },
            { status: 400 }
          );
        }
      }
    }

    // Guard: P-1 requires a BOM requisition to have been raised for this unit before completion
    if (status === 'COMPLETED' && tracking.actionItem.stepId === 'P-1') {
      const existingMrq = await prisma.productionMaterialRequisition.findFirst({
        where: {
          productionOrderId: id,
          productionUnitId: unitId,
          status: { not: 'CANCELLED' },
        },
      });
      if (!existingMrq) {
        return NextResponse.json(
          { error: 'P-1 cannot be completed until a Material Requisition (BOM sign-out) has been raised for this unit from the Materials tab.' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;

      if (status === 'IN_PROGRESS' && !tracking.startedAt) {
        updateData.startedAt = new Date();
      }
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
        updateData.completedById = session.user.id;
        if (!tracking.startedAt) {
          updateData.startedAt = new Date();
        }
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (decisionOutcome !== undefined) {
      updateData.decisionOutcome = decisionOutcome;
    }
    if (rejectionReason !== undefined) {
      updateData.rejectionReason = rejectionReason;
    }
    if (rejectionCategory !== undefined) {
      updateData.rejectionCategory = rejectionCategory;
    }

    // No auto-skip needed on QC-1 PASS — rework is now managed externally via UnitRework records

    const updatedTracking = await prisma.$transaction(async (tx) => {
      // 1. Update the tracking record
      const result = await tx.unitStepTracking.update({
        where: { id: trackingId },
        data: updateData,
        include: {
          completedBy: { select: { id: true, name: true, email: true } },
          _count: { select: { activities: true } },
        },
      });

      // 2. Auto-complete unit if all its trackings are done
      if (status === 'COMPLETED' || status === 'SKIPPED') {
        const allUnitTrackings = await tx.unitStepTracking.findMany({
          where: { unitId },
          select: { status: true },
        });

        const allDone = allUnitTrackings.every(
          (t) => t.status === 'COMPLETED' || t.status === 'SKIPPED'
        );

        if (allDone) {
          await tx.productionUnit.update({
            where: { id: unitId },
            data: { status: 'COMPLETED' },
          });

          // 3. Auto-complete order if all units are now done
          const allUnits = await tx.productionUnit.findMany({
            where: { productionOrderId: id },
            select: { status: true },
          });

          if (allUnits.every((u) => u.status === 'COMPLETED')) {
            await tx.productionOrder.update({
              where: { id },
              data: { status: 'COMPLETED', actualEnd: new Date() },
            });
          }
        }
      }

      // 3. Recompute order yield fields when a decision-point outcome is recorded
      if (decisionOutcome !== undefined) {
        const [orderData, allDecisionTrackings, qtyReworked] = await Promise.all([
          tx.productionOrder.findUnique({ where: { id }, select: { quantity: true } }),
          tx.unitStepTracking.findMany({
            where: { unit: { productionOrderId: id }, decisionOutcome: { not: null } },
            select: { decisionOutcome: true, actionItem: { select: { stepId: true } } },
          }),
          tx.unitRework.count({ where: { productionUnit: { productionOrderId: id } } }),
        ]);

        const finalTrackings = allDecisionTrackings.filter((t) => t.actionItem.stepId === 'QC-3');
        const qtyPassed = finalTrackings.filter((t) => t.decisionOutcome === 'PASS').length;
        const qtyRejected = finalTrackings.filter((t) => t.decisionOutcome === 'FAIL').length;
        const totalQty = orderData?.quantity ?? 0;
        const yieldRate = totalQty > 0 ? Math.round((qtyPassed / totalQty) * 1000) / 10 : null;

        await tx.productionOrder.update({
          where: { id },
          data: {
            quantityStarted: totalQty,
            quantityPassed: qtyPassed || null,
            quantityRejected: qtyRejected || null,
            quantityReworked: qtyReworked || null,
            quantityPackaged: qtyPassed || null,
            yieldRate,
          },
        });
      }

      // 4. Bootstrap DRAFT order → IN_PROGRESS on first step activity
      if (status === 'IN_PROGRESS' || status === 'COMPLETED') {
        const order = await tx.productionOrder.findUnique({
          where: { id },
          select: { status: true },
        });
        if (order?.status === 'DRAFT') {
          await tx.productionOrder.update({
            where: { id },
            data: { status: 'IN_PROGRESS', actualStart: new Date() },
          });
          await tx.productionRequest.updateMany({
            where: { productionOrderId: id },
            data: { status: 'SCHEDULED' },
          });
        }
      }

      // 5. Audit log
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: `${status === 'COMPLETED' ? 'Completed' : 'Updated'} Unit Step: ${tracking.actionItem.actionName}`,
          module: 'Production',
          details: {
            orderId: id,
            unitObjId: unitId,
            unitIdStr: tracking.unit.unitId,
            trackingId,
            stepId: tracking.actionItem.stepId,
            changes: body,
          },
        },
      });

      return result;
    });

    // Post-transaction: fetch aggregate state so the client can merge without a full refetch
    const [updatedUnit, updatedOrder, totalActions, completedActions] = await Promise.all([
      prisma.productionUnit.findUnique({
        where: { id: unitId },
        select: { status: true },
      }),
      prisma.productionOrder.findUnique({
        where: { id },
        select: {
          status: true, actualStart: true, actualEnd: true,
          scheduledStart: true, scheduledEnd: true, quantity: true,
          quantityPassed: true, quantityRejected: true,
          quantityReworked: true, quantityPackaged: true, yieldRate: true,
        },
      }),
      prisma.unitStepTracking.count({ where: { unit: { productionOrderId: id } } }),
      prisma.unitStepTracking.count({
        where: { unit: { productionOrderId: id }, status: { in: ['COMPLETED', 'SKIPPED'] } },
      }),
    ]);

    const progressPercent = computeProgressPercent(completedActions, totalActions);
    const scheduleStatus = computeScheduleStatus(updatedOrder!, progressPercent);
    const shortfallQuantity = computeShortfall(updatedOrder!.quantityPackaged, updatedOrder!.quantity);

    return NextResponse.json({
      tracking: updatedTracking,
      unitStatus: updatedUnit?.status ?? 'IN_PROGRESS',
      orderPatch: {
        status: updatedOrder!.status,
        actualStart: updatedOrder!.actualStart,
        actualEnd: updatedOrder!.actualEnd,
        progressPercent,
        completedActions,
        totalActions,
        scheduleStatus,
        shortfallQuantity,
        quantityPassed: updatedOrder!.quantityPassed,
        quantityRejected: updatedOrder!.quantityRejected,
        quantityReworked: updatedOrder!.quantityReworked,
        quantityPackaged: updatedOrder!.quantityPackaged,
        yieldRate: updatedOrder!.yieldRate,
      },
    });
  } catch (error) {
    console.error('Error updating unit matching record:', error);
    return NextResponse.json(
      { error: 'Failed to update tracking record' },
      { status: 500 }
    );
  }
}
