import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = id;

    const group = await prisma.toolGroup.findUnique({
      where: {
        id: groupId,
        isActive: true,
      },
      include: {
        tools: {
          where: {
            isActive: true,
          },
          orderBy: {
            toolId: 'asc',
          },
          select: {
            id: true,
            toolId: true,
            status: true,
            condition: true,
            currentHolder: true,
            location: true,
            purchaseDate: true,
            purchaseCost: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Tool group not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: group.id,
      name: group.name,
      groupNumber: group.groupNumber,
      category: group.category,
      description: group.description,
      manufacturer: group.manufacturer,
      model: group.model,
      totalQuantity: group.totalQuantity,
      availableQuantity: group.availableQuantity,
      unitCost: group.unitCost,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      tools: group.tools,
    });
  } catch (error) {
    console.error('Error fetching tool group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool group' },
      { status: 500 },
    );
  }
}
