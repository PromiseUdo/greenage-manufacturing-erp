// app/api/production/requests/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const params = await context.params;
  const { id } = params;

  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productionRequest = await prisma.productionRequest.findUnique({
      where: { id },
      include: {
        storeItem: {
          select: {
            id: true,
            name: true,
            itemNumber: true,
            category: true,
            quantity: true,
            unitPrice: true,
          },
        },
        quoteLineItem: {
          select: {
            id: true,
            quantity: true,
            quantityAllocated: true,
            quantityBackordered: true,
            backorderStatus: true,
            unitPrice: true,
          },
        },
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!productionRequest) {
      return NextResponse.json(
        { error: 'Production request not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(productionRequest);
  } catch (error) {
    console.error('Error fetching production request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production request' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const params = await context.params;
  const { id } = params;

  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, notes } = body;

    const productionRequest = await prisma.productionRequest.findUnique({
      where: { id },
      include: {
        quote: true,
        quoteLineItem: true,
        storeItem: true,
      },
    });

    if (!productionRequest) {
      return NextResponse.json(
        { error: 'Production request not found' },
        { status: 404 },
      );
    }

    // --- Completion flow: restore stock and update backorder on the line item ---
    if (status === 'COMPLETED' && productionRequest.status !== 'COMPLETED') {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Add produced quantity back to store item stock
        await tx.storeItem.update({
          where: { id: productionRequest.storeItemId },
          data: {
            quantity: { increment: productionRequest.quantityNeeded },
          },
        });

        // 2. Update the QuoteLineItem's backorder status
        await tx.quoteLineItem.update({
          where: { id: productionRequest.quoteLineItemId },
          data: {
            backorderStatus: 'FULFILLED',
            quantityBackordered: 0,
            quantityAllocated: productionRequest.quoteLineItem.quantity,
          },
        });

        // 3. Update the production request itself
        const updated = await tx.productionRequest.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            dateCompleted: new Date(),
            ...(notes !== undefined && { notes }),
          },
          include: {
            storeItem: {
              select: {
                id: true,
                name: true,
                itemNumber: true,
                quantity: true,
              },
            },
            quoteLineItem: {
              select: {
                id: true,
                backorderStatus: true,
                quantityAllocated: true,
                quantityBackordered: true,
              },
            },
            quote: {
              select: {
                id: true,
                quoteNumber: true,
              },
            },
          },
        });

        return updated;
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'Completed Production Request',
          module: 'Production',
          details: {
            requestId: id,
            requestNumber: productionRequest.requestNumber,
            quantityProduced: productionRequest.quantityNeeded,
            storeItemId: productionRequest.storeItemId,
            quoteLineItemId: productionRequest.quoteLineItemId,
            quoteId: productionRequest.quoteId,
          },
        },
      });

      return NextResponse.json(result);
    }

    // --- Non-completion status update ---
    const updateData: any = {};

    if (status) {
      updateData.status = status;

      // When status changes to IN_PRODUCTION-related statuses,
      // also update the line item's backorder status
      if (status === 'ACKNOWLEDGED' || status === 'SCHEDULED') {
        await prisma.quoteLineItem.update({
          where: { id: productionRequest.quoteLineItemId },
          data: { backorderStatus: 'IN_PRODUCTION' },
        });
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updated = await prisma.productionRequest.update({
      where: { id },
      data: updateData,
      include: {
        storeItem: {
          select: {
            id: true,
            name: true,
            itemNumber: true,
            quantity: true,
          },
        },
        quoteLineItem: {
          select: {
            id: true,
            backorderStatus: true,
          },
        },
        quote: {
          select: {
            id: true,
            quoteNumber: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Updated Production Request',
        module: 'Production',
        details: {
          requestId: id,
          requestNumber: productionRequest.requestNumber,
          newStatus: status,
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating production request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update production request' },
      { status: 500 },
    );
  }
}
