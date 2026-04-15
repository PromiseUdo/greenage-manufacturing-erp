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

    const payments = await prisma.payment.findMany({
      where: { purchaseOrderId: id },
      orderBy: { paymentDate: 'desc' },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // if (
    //   !['ADMIN', 'STORE_KEEPER', 'OPERATION_MANAGER'].includes(
    //     session.user.role
    //   )
    // ) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const { id } = await params;
    const body = await request.json();
    const { amount, paymentMethod, reference, paymentDate, notes } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid payment amount is required' },
        { status: 400 },
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 },
      );
    }

    // Verify PO exists
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!po) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 },
      );
    }

    const newPaidAmount = po.paidAmount + amount;
    const isFullyPaid = newPaidAmount >= po.totalAmount;

    // Create payment and update PO in a transaction
    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          purchaseOrderId: id,
          amount,
          paymentMethod,
          reference: reference || null,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          notes: notes || null,
          recordedBy: session.user.name as string,
        },
      }),
      prisma.purchaseOrder.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          paymentStatus: isFullyPaid ? 'Paid' : 'Partial',
        },
      }),
    ]);

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `Recorded Payment (₦${amount.toLocaleString()})`,
        module: 'Inventory',
        details: {
          poId: id,
          poNumber: po.poNumber,
          paymentId: payment.id,
          amount,
          paymentMethod,
          totalPaid: newPaidAmount,
          totalAmount: po.totalAmount,
          isFullyPaid,
        },
      },
    });

    return NextResponse.json(
      {
        payment,
        paidAmount: newPaidAmount,
        isFullyPaid,
        paymentStatus: isFullyPaid ? 'Paid' : 'Partial',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 },
    );
  }
}
