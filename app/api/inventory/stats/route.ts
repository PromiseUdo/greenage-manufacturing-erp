// src/app/api/inventory/stats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Get all materials for calculations
    const materials = await prisma.material.findMany({
      where: { isActive: true },
    });

    // Calculate statistics
    const totalMaterials = materials.length;
    const totalValue = materials.reduce(
      (sum, m) => sum + m.currentStock * (m.unitCost || 0),
      0
    );
    const lowStockItems = materials.filter(
      (m) => m.currentStock <= m.reorderLevel && m.currentStock > 0
    ).length;
    const outOfStockItems = materials.filter(
      (m) => m.currentStock === 0
    ).length;

    // Category breakdown
    const categoryStats = materials.reduce((acc: any, m) => {
      if (!acc[m.category]) {
        acc[m.category] = { count: 0, value: 0 };
      }
      acc[m.category].count += 1;
      acc[m.category].value += m.currentStock * (m.unitCost || 0);
      return acc;
    }, {});

    const categories = Object.entries(categoryStats).map(
      ([category, data]: any) => ({
        category,
        count: data.count,
        value: data.value,
      })
    );

    // Recent issuances (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentIssuances = await prisma.materialIssuance.count({
      where: {
        issuedAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Total suppliers
    const totalSuppliers = await prisma.supplier.count({
      where: { isActive: true },
    });

    // Low stock alerts
    const lowStockAlerts = materials
      .filter((m) => m.currentStock <= m.reorderLevel)
      .map((m) => ({
        materialId: m.id,
        materialName: m.name,
        partNumber: m.partNumber,
        currentStock: m.currentStock,
        reorderLevel: m.reorderLevel,
        alertType: m.currentStock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
        severity: m.currentStock === 0 ? 'error' : 'warning',
      }));

    const stats = {
      totalMaterials,
      totalValue: Math.round(totalValue),
      lowStockItems,
      outOfStockItems,
      totalSuppliers,
      recentIssuances,
      categories,
      lowStockAlerts,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory stats' },
      { status: 500 }
    );
  }
}
