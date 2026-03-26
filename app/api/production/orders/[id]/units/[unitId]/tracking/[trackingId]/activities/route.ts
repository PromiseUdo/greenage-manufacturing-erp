import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string; unitId: string; trackingId: string }>;
}

// GET /api/production/orders/[id]/units/[unitId]/tracking/[trackingId]/activities
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: orderId, unitId, trackingId } = await params;

    const tracking = await prisma.unitStepTracking.findUnique({
      where: { id: trackingId, unitId },
    });

    if (!tracking) {
      return NextResponse.json({ error: "Tracking not found" }, { status: 404 });
    }

    const activities = await prisma.productionStepActivity.findMany({
      where: { unitStepTrackingId: trackingId },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("GET activities error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/production/orders/[id]/units/[unitId]/tracking/[trackingId]/activities
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: orderId, unitId, trackingId } = await params;
    const body = await req.json();
    const { comment, attachments, type = "COMMENT" } = body;

    if (!comment && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: "Comment text or at least one attachment is required" },
        { status: 400 }
      );
    }

    const tracking = await prisma.unitStepTracking.findUnique({
      where: { id: trackingId, unitId },
    });

    if (!tracking) {
      return NextResponse.json({ error: "Tracking not found" }, { status: 404 });
    }

    const activity = await prisma.productionStepActivity.create({
      data: {
        unitStepTrackingId: trackingId,
        authorId: session.user.id,
        type: attachments && attachments.length > 0 && !comment ? "ATTACHMENT" : type,
        comment: comment || null,
        attachments: attachments && attachments.length > 0 ? attachments : null,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    console.error("POST activities error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
