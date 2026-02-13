// app/api/store/dispatches/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const dispatch = await prisma.storeDispatch.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            contactPerson: true,
          },
        },
      },
    });

    if (!dispatch) {
      return NextResponse.json(
        { error: 'Store dispatch not found' },
        { status: 404 },
      );
    }

    // Fetch invoice details if invoiceId exists
    let invoice = null;
    if (dispatch.invoiceId) {
      invoice = await prisma.invoice.findUnique({
        where: { id: dispatch.invoiceId },
        select: {
          id: true,
          invoiceNumber: true,
          finalAmount: true,
          status: true,
          paymentStatus: true,
        },
      });
    }

    return NextResponse.json({ ...dispatch, invoice });
  } catch (error) {
    console.error('Error fetching store dispatch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store dispatch' },
      { status: 500 },
    );
  }
}
