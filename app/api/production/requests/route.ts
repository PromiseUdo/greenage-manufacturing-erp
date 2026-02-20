// app/api/production/requests/route.ts

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { requestNumber: { contains: search, mode: 'insensitive' } },
        { storeItem: { name: { contains: search, mode: 'insensitive' } } },
        { quote: { quoteNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [requests, total] = await Promise.all([
      prisma.productionRequest.findMany({
        where,
        include: {
          storeItem: {
            select: {
              id: true,
              name: true,
              itemNumber: true,
              category: true,
              quantity: true,
            },
          },
          quoteLineItem: {
            select: {
              id: true,
              quantity: true,
              quantityAllocated: true,
              quantityBackordered: true,
              backorderStatus: true,
            },
          },
          quote: {
            select: {
              id: true,
              quoteNumber: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.productionRequest.count({ where }),
    ]);

    return NextResponse.json({
      requests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching production requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production requests' },
      { status: 500 },
    );
  }
}
