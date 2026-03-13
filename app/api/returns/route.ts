import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const returns = await prisma.productReturn.findMany({
      where,
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
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(returns);
  } catch (error) {
    console.error('Error fetching returns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch returns' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerId,
      orderId,
      productId,
      unitId,
      serialNumber,
      quantity = 1,
      issueReported,
      condition,
    } = body;

    if (!customerId || !productId || !issueReported) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate return number
    const count = await prisma.productReturn.count();
    const returnNumber = `RET-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const newReturn = await prisma.productReturn.create({
      data: {
        returnNumber,
        customerId,
        orderId: orderId || undefined,
        productId,
        unitId: unitId || undefined,
        serialNumber: serialNumber || undefined,
        quantity,
        issueReported,
        condition,
        receivedById: session.user.id,
        status: 'RECEIVED'
      },
      include: {
        customer: true,
        product: true,
        receivedBy: true
      }
    });

    return NextResponse.json(newReturn, { status: 201 });
  } catch (error) {
    console.error('Error creating return:', error);
    return NextResponse.json(
      { error: 'Failed to create product return' },
      { status: 500 }
    );
  }
}
