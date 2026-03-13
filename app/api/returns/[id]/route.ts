import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const productReturn = await prisma.productReturn.findUnique({
      where: { id },
      include: {
        customer: true,
        product: true,
        receivedBy: {
          select: { id: true, name: true }
        },
        handledBy: {
          select: { id: true, name: true }
        },
        recommendedBy: {
          select: { id: true, name: true }
        },
        order: {
          select: { id: true, orderNumber: true }
        }
      },
    });

    if (!productReturn) {
      return NextResponse.json(
        { error: 'Return not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(productReturn);
  } catch (error) {
    console.error('Error fetching return:', error);
    return NextResponse.json(
      { error: 'Failed to fetch return details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    // We filter the body to exclude fields we shouldn't update directly here
    const {
      status,
      evaluationNotes,
      recommendedAction,
      repairNotes,
      partsReplaced,
      repairCost,
      dispatchNotes
    } = body;
    
    let updateData: any = {};
    if (status) updateData.status = status;
    if (evaluationNotes !== undefined) updateData.evaluationNotes = evaluationNotes;
    if (recommendedAction !== undefined) {
      updateData.recommendedAction = recommendedAction;
      updateData.recommendedById = session.user.id;
      updateData.recommendationDate = new Date();
    }
    if (repairNotes !== undefined) updateData.repairNotes = repairNotes;
    if (partsReplaced !== undefined) updateData.partsReplaced = partsReplaced;
    if (repairCost !== undefined) updateData.repairCost = repairCost;
    if (dispatchNotes !== undefined) updateData.dispatchNotes = dispatchNotes;

    if (status === 'DISPATCHED') {
      updateData.dateDispatched = new Date();
    }
    
    if (status === 'IN_REPAIR' || status === 'INSPECTING' || status === 'REPAIR_COMPLETED') {
      updateData.handledById = session.user.id;
    }

    const updatedReturn = await prisma.productReturn.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        product: true,
        receivedBy: { select: { id: true, name: true } },
        handledBy: { select: { id: true, name: true } },
        recommendedBy: { select: { id: true, name: true } },
        order: { select: { id: true, orderNumber: true } }
      }
    });

    return NextResponse.json(updatedReturn);
  } catch (error) {
    console.error('Error updating return:', error);
    return NextResponse.json(
      { error: 'Failed to update return' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.productReturn.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting return:', error);
    return NextResponse.json(
      { error: 'Failed to delete return' },
      { status: 500 }
    );
  }
}
