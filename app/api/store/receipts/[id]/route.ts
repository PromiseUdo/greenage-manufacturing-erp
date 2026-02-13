// app/api/store/receipts/[id]/route.ts

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

    const receipt = await prisma.storeReceipt.findUnique({
      where: { id },
    });

    if (!receipt) {
      return NextResponse.json(
        { error: 'Store receipt not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(receipt);
  } catch (error) {
    console.error('Error fetching store receipt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store receipt' },
      { status: 500 },
    );
  }
}
