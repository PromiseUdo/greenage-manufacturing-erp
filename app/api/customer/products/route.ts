import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  const where: any = {
    isActive: true,
    quantity: { gt: 0 },
    condition: { in: ['NEW', 'REFURBISHED'] },
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { itemNumber: { contains: search, mode: 'insensitive' } },
      { batchNumber: { contains: search, mode: 'insensitive' } },
      { product: { description: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (category) {
    where.category = category;
  }

  const [storeItems, total] = await Promise.all([
    prisma.storeItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
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
        location: true,
        imageUrl: true,
        imagePublicId: true,
        product: {
          select: {
            id: true,
            description: true,
            primaryImage: true,
            images: true,
            model: true,
            warranty: true,
            leadTime: true,
          },
        },
      },
    }),
    prisma.storeItem.count({ where }),
  ]);

  return NextResponse.json({
    storeItems,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
