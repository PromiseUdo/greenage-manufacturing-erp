import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

const UNIT_INCLUDE = {
  inspectedBy: { select: { id: true, name: true } },
  approvedBy: { select: { id: true, name: true } },
  repairTasks: {
    include: {
      assignedTo: { select: { id: true, name: true } },
      completedBy: { select: { id: true, name: true } },
    },
    orderBy: { sortOrder: 'asc' as const },
  },
};

// GET — list all units for a return (auto-initialise if none exist yet)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const productReturn = await prisma.productReturn.findUnique({
      where: { id },
      select: { id: true, quantity: true, serialNumber: true },
    });
    if (!productReturn) return NextResponse.json({ error: 'Return not found' }, { status: 404 });

    let units = await prisma.returnUnit.findMany({
      where: { returnId: id },
      include: UNIT_INCLUDE,
      orderBy: { unitNumber: 'asc' },
    });

    // Auto-initialise units on first access
    if (units.length === 0) {
      const qty = productReturn.quantity ?? 1;
      await prisma.returnUnit.createMany({
        data: Array.from({ length: qty }, (_, i) => ({
          returnId: id,
          unitNumber: i + 1,
          serialNumber: qty === 1 ? (productReturn.serialNumber ?? null) : null,
        })),
      });
      units = await prisma.returnUnit.findMany({
        where: { returnId: id },
        include: UNIT_INCLUDE,
        orderBy: { unitNumber: 'asc' },
      });
    }

    return NextResponse.json({ units });
  } catch (error) {
    console.error('Error fetching return units:', error);
    return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 });
  }
}
