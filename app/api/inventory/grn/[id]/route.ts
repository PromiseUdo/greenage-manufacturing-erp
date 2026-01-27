// src/app/api/inventory/grn/[id]/route.ts

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

    const grn = await prisma.gRN.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        batches: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                partNumber: true,
                category: true,
                unit: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!grn) {
      return NextResponse.json({ error: 'GRN not found' }, { status: 404 });
    }

    return NextResponse.json(grn);
  } catch (error) {
    console.error('Error fetching GRN:', error);
    return NextResponse.json({ error: 'Failed to fetch GRN' }, { status: 500 });
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

    if (!['ADMIN', 'STORE_KEEPER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { notes, attachments } = body;

    const grn = await prisma.gRN.update({
      where: { id },
      data: {
        ...(notes !== undefined && { notes }),
        ...(attachments !== undefined && { attachments }),
      },
      include: {
        supplier: true,
        batches: {
          include: {
            material: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Updated GRN',
        module: 'Inventory',
        details: {
          grnId: grn.id,
          grnNumber: grn.grnNumber,
          changes: { notes, attachments: attachments?.length || 0 },
        },
      },
    });

    return NextResponse.json(grn);
  } catch (error) {
    console.error('Error updating GRN:', error);
    return NextResponse.json(
      { error: 'Failed to update GRN' },
      { status: 500 },
    );
  }
}
