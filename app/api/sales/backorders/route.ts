// app/api/sales/backorders/route.ts

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

    // Query QuoteLineItems that are backordered
    const where: any = {
      backorderStatus: {
        in: ['PENDING', 'IN_PRODUCTION'],
      },
    };

    if (search) {
      where.OR = [
        { quote: { quoteNumber: { contains: search, mode: 'insensitive' } } },
        { quote: { customer: { name: { contains: search, mode: 'insensitive' } } } },
        { storeItem: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.backorderStatus = status;
    }

    const [backorders, total] = await Promise.all([
      prisma.quoteLineItem.findMany({
        where,
        include: {
          quote: {
            select: {
              id: true,
              quoteNumber: true,
              customerId: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          storeItem: {
            select: {
              id: true,
              name: true,
              itemNumber: true,
              quantity: true,
            },
          },
          productionRequests: {
            select: {
              id: true,
              requestNumber: true,
              status: true,
              quantityNeeded: true,
              dateRaised: true,
            },
          },
        },
        orderBy: { backorderCreatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.quoteLineItem.count({ where }),
    ]);

    return NextResponse.json({
      backorders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching backorders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backorders' },
      { status: 500 },
    );
  }
}
