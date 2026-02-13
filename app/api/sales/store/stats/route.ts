import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch Item Stats (Quantity, Value, Low Stock)
    const items = await prisma.storeItem.findMany({
      select: {
        id: true,
        quantity: true,
        unitPrice: true,
        category: true,
        condition: true,
      },
    });

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce(
      (sum, item) => sum + item.quantity * (item.unitPrice || 0),
      0,
    );
    const lowStockCount = items.filter((item) => item.quantity < 10).length; // Configurable threshold
    const outOfStockCount = items.filter((item) => item.quantity === 0).length;

    // 2. Recent Receipts
    const recentReceipts = await prisma.storeReceipt.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        receiptNumber: true,
        receivedDate: true,
        source: true,
        items: true,
      },
    });

    // 3. Recent Dispatches
    const recentDispatches = await prisma.storeDispatch.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: { name: true },
        },
      },
    });

    // 4. Category Distribution
    const categoryStats = items.reduce(
      (acc, item) => {
        const cat = item.category;
        if (!acc[cat]) {
          acc[cat] = { count: 0, value: 0 };
        }
        acc[cat].count += item.quantity;
        acc[cat].value += item.quantity * (item.unitPrice || 0);
        return acc;
      },
      {} as Record<string, { count: number; value: number }>,
    );

    const categories = Object.entries(categoryStats).map(([key, stat]) => ({
      category: key,
      count: stat.count,
      value: stat.value,
    }));

    return NextResponse.json({
      totalItems,
      totalValue,
      lowStockCount,
      outOfStockCount,
      recentReceipts: recentReceipts.map((r) => ({
        ...r,
        itemCount: (r.items as any[])?.length || 0,
      })),
      recentDispatches: recentDispatches.map((d) => ({
        ...d,
        itemCount: (d.items as any[])?.length || 0,
      })),
      categories,
    });
  } catch (error) {
    console.error("Error fetching store stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch store stats" },
      { status: 500 },
    );
  }
}
