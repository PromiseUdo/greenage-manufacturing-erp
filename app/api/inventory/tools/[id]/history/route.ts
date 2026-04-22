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

    const tool = await prisma.tool.findUnique({
      where: { id },
      select: { id: true, name: true, toolId: true },
    });

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    const [lendings, maintenance] = await Promise.all([
      prisma.toolLending.findMany({
        where: { toolId: id },
        orderBy: { issuedAt: 'asc' },
      }),
      prisma.toolMaintenance.findMany({
        where: { toolId: id },
        orderBy: { startDate: 'asc' },
      }),
    ]);

    type EventType = 'ISSUED' | 'RETURNED' | 'MAINTENANCE';

    type ToolEvent = {
      type: EventType;
      date: Date;
      actor: string;
      recipient: string;
      department: string;
      purpose: string;
      condition: string;
      notes: string;
      lendingId?: string;
      maintenanceType?: string;
      cost?: number;
      statusAfter: string;
    };

    const events: ToolEvent[] = [];

    for (const l of lendings) {
      events.push({
        type: 'ISSUED',
        date: new Date(l.issuedAt),
        actor: l.issuedBy,
        recipient: l.issuedTo,
        department: l.department || '',
        purpose: l.purpose || l.projectName || '',
        condition: '',
        notes: '',
        lendingId: l.id,
        statusAfter: 'IN_USE',
      });

      if (l.returnedAt) {
        events.push({
          type: 'RETURNED',
          date: new Date(l.returnedAt),
          actor: l.returnedTo || '',
          recipient: l.issuedTo,
          department: l.department || '',
          purpose: l.purpose || l.projectName || '',
          condition: l.returnCondition || '',
          notes: l.returnNotes || '',
          lendingId: l.id,
          statusAfter:
            l.status === 'DAMAGED'
              ? 'DAMAGED'
              : l.returnCondition === 'NEEDS_REPAIR' || l.returnCondition === 'POOR'
                ? 'UNDER_MAINTENANCE'
                : 'AVAILABLE',
        });
      }
    }

    for (const m of maintenance) {
      events.push({
        type: 'MAINTENANCE',
        date: new Date(m.startDate),
        actor: m.performedBy,
        recipient: '',
        department: '',
        purpose: m.description || '',
        condition: '',
        notes: m.notes || '',
        maintenanceType: m.maintenanceType,
        cost: m.cost ?? undefined,
        statusAfter: 'UNDER_MAINTENANCE',
      });
    }

    // Sort chronological for display (newest first)
    events.sort((a, b) => b.date.getTime() - a.date.getTime());

    const totalIssued = lendings.length;
    const totalReturned = lendings.filter((l) => l.returnedAt).length;
    const totalMaintenance = maintenance.length;
    const currentlyOut = lendings.filter((l) => l.status === 'ISSUED').length;

    return NextResponse.json({
      events,
      summary: {
        totalIssued,
        totalReturned,
        totalMaintenance,
        currentlyOut,
      },
    });
  } catch (error) {
    console.error('Error fetching tool history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool history' },
      { status: 500 },
    );
  }
}
