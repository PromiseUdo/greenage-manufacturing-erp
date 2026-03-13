// src/app/api/quotes/[id]/route.ts

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

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        lineItems: {
          include: {
            storeItem: true,
            product: {
              select: {
                id: true,
                name: true,
                productNumber: true,
                productCode: true,
                category: true,
                model: true,
                specifications: true,
              },
            },
            productionRequests: {
              select: {
                id: true,
                requestNumber: true,
                quantityNeeded: true,
                status: true,
                dateRaised: true,
                dateCompleted: true,
              },
            },
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            paidAmount: true,
            balanceAmount: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
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

    const quote = await prisma.quote.findUnique({ where: { id } });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating quote:', error);
    return NextResponse.json(
      { error: 'Failed to update quote' },
      { status: 500 },
    );
  }
}



export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    console.log('SESSION USER:', session.user);


    // if (
    //   !['ADMIN', 'PRODUCTION_MANAGER'].includes(session.user.role) &&
    //   !session.user.permissions?.includes('sales:delete')
    // ) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }


    if (!session.user.permissions?.includes('sales:delete')) {
  return NextResponse.json({ error: 'You do not have permission to delete quotes.' }, { status: 403 });
}


 // Fetch user with role + permissions from DB


    const { id } = await params;

    const quote = await prisma.quote.findUnique({
      where: { id },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    if (quote.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only DRAFT quotes can be deleted' },
        { status: 400 }
      );
    }


      // Delete order
      await prisma.quote.delete({
        where: { id },
      });
      

    

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Deleted Quote',
        module: 'Sales',
        details: {
          quoteNumber: quote.quoteNumber,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting production order:', error);
    return NextResponse.json(
      { error: 'Failed to delete production order' },
      { status: 500 }
    );
  }
}