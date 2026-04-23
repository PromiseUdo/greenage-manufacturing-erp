import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { groupNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const toolGroups = await prisma.toolGroup.findMany({
      where,
      select: {
        id: true,
        name: true,
        groupNumber: true,
        category: true,
        unitCost: true,
        totalQuantity: true,
        availableQuantity: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ toolGroups });
  } catch (error) {
    console.error('Error fetching tool groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool groups' },
      { status: 500 },
    );
  }
}
