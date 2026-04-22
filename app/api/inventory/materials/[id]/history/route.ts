import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const params = await context.params;
  const { id } = params;

  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const material = await prisma.material.findUnique({
      where: { id },
      select: { id: true, currentStock: true, unit: true },
    });

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    const [batches, issuances] = await Promise.all([
      prisma.materialBatch.findMany({
        where: { materialId: id },
        include: { grn: { select: { grnNumber: true, invoiceNumber: true } } },
        orderBy: { receivedDate: 'asc' },
      }),
      prisma.materialIssuance.findMany({
        where: { materialId: id },
        orderBy: { issuedAt: 'asc' },
      }),
    ]);

    type Movement = {
      type: 'IN' | 'OUT';
      date: Date;
      quantity: number;
      reference: string;
      source: string;
      note: string;
      runningBalance: number;
    };

    const raw: Omit<Movement, 'runningBalance'>[] = [
      ...batches.map((b) => ({
        type: 'IN' as const,
        date: new Date(b.receivedDate),
        quantity: b.quantity,
        reference: b.batchNumber,
        source: b.grn ? `GRN ${b.grn.grnNumber}` : 'Direct receipt',
        note: b.grn?.invoiceNumber ? `Invoice: ${b.grn.invoiceNumber}` : '',
      })),
      ...issuances.map((i) => ({
        type: 'OUT' as const,
        date: new Date(i.issuedAt),
        quantity: i.quantity,
        reference: i.batchNumber,
        source: i.issuedTo,
        note: i.purpose || i.orderId || '',
      })),
    ];

    // Sort chronologically oldest → newest to compute running balance forward
    raw.sort((a, b) => a.date.getTime() - b.date.getTime());

    let balance = 0;
    const movements: Movement[] = raw.map((m) => {
      balance += m.type === 'IN' ? m.quantity : -m.quantity;
      return { ...m, runningBalance: balance };
    });

    // Reverse for display (newest first)
    movements.reverse();

    const totalIn = batches.reduce((s, b) => s + b.quantity, 0);
    const totalOut = issuances.reduce((s, i) => s + i.quantity, 0);

    return NextResponse.json({
      movements,
      summary: {
        totalIn,
        totalOut,
        currentStock: material.currentStock,
        unit: material.unit,
      },
    });
  } catch (error) {
    console.error('Error fetching material history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material history' },
      { status: 500 },
    );
  }
}
