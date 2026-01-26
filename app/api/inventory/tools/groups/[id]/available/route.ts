// src/app/api/inventory/tools/groups/[id]/available/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const { id } = params;

  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const availableTools = await prisma.tool.findMany({
      where: {
        toolGroupId: id,
        status: 'AVAILABLE',
        isActive: true,
      },
      select: {
        id: true,
        toolId: true,
        condition: true,
        location: true,
      },
      orderBy: [{ condition: 'asc' }, { toolId: 'asc' }],
    });

    return NextResponse.json({ availableTools });
  } catch (error) {
    console.error('Error fetching group tools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available tools' },
      { status: 500 },
    );
  }
}
