import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const storeItemId = params.id;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const isExport = searchParams.get('export') === 'true';

    const skip = (page - 1) * limit;

    // The items array in storeDispatches is a JSON array. 
    // Example format: [{ "storeItemId": "670f5...", "itemNumber": "...", "quantity": 1 }]
    // We can query inside the JSON array using MongoDB's $elemMatch operator via Prisma raw
    
    // 1. Find the object IDs of the matching dispatches using raw MongoDB query
    const matchingDispatchesRaw = (await prisma.storeDispatch.findRaw({
      filter: {
        "items": {
          "$elemMatch": {
            "storeItemId": storeItemId
          }
        }
      },
      options: {
        projection: { _id: 1 }
      }
    })) as unknown as any[];

    // Extract the IDs (MongoDB ObjectIDs come back as { $oid: "..." })
    const matchedIds = matchingDispatchesRaw.map((doc: any) => doc._id.$oid);

    if (matchedIds.length === 0) {
      if (isExport) return NextResponse.json({ dispatches: [] });
      return NextResponse.json({
        dispatches: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
      });
    }

    const where = { id: { in: matchedIds } };

    const queryOptions = {
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' as const },
    };

    // Export mode: return all matching records without pagination
    if (isExport) {
      const dispatches = await prisma.storeDispatch.findMany(queryOptions);
      return NextResponse.json({ dispatches });
    }

    const [dispatches, total] = await Promise.all([
      prisma.storeDispatch.findMany({ ...queryOptions, skip, take: limit }),
      prisma.storeDispatch.count({ where }),
    ]);

    return NextResponse.json({
      dispatches,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching store dispatches for item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store dispatches' },
      { status: 500 },
    );
  }
}
