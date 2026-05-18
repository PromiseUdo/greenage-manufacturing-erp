import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const storeItem = await prisma.storeItem.findFirst({
    where: { id, isActive: true },
    select: {
      id: true,
      itemNumber: true,
      name: true,
      category: true,
      quantity: true,
      unit: true,
      condition: true,
      unitPrice: true,
      warrantyExpiry: true,
      batchNumber: true,
      location: true,
      notes: true,
      imageUrl: true,
      imagePublicId: true,
      product: {
        select: {
          id: true,
          productNumber: true,
          description: true,
          primaryImage: true,
          images: true,
          model: true,
          warranty: true,
          leadTime: true,
          specifications: true,
          tags: true,
        },
      },
    },
  });

  if (!storeItem) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  return NextResponse.json({ storeItem });
}
