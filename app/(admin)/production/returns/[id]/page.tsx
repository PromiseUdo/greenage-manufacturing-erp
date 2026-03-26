import { prisma } from '@/lib/prisma';
import ProductionReturnDetailClient from './components/return-detail-client';
import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';

export default async function ProductionReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const { id } = await params;

  const returnItem = await prisma.productReturn.findUnique({
    where: { id },
    include: {
      customer: true,
      product: true,
      receivedBy: { select: { id: true, name: true } },
      handledBy: { select: { id: true, name: true } },
      recommendedBy: { select: { id: true, name: true } },
      order: true,
      // Legacy repair tasks (return-level, no unit)
      repairTasks: {
        where: { returnUnitId: null },
        include: {
          assignedTo: { select: { id: true, name: true } },
          completedBy: { select: { id: true, name: true } },
        },
        orderBy: { sortOrder: 'asc' },
      },
      // Per-unit tracking
      returnUnits: {
        include: {
          inspectedBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
          repairTasks: {
            include: {
              assignedTo: { select: { id: true, name: true } },
              completedBy: { select: { id: true, name: true } },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { unitNumber: 'asc' },
      },
      materialRequisitions: {
        include: {
          requestedBy: { select: { id: true, name: true } },
          fulfilledBy: { select: { id: true, name: true } },
          items: {
            include: {
              material: {
                select: { id: true, name: true, partNumber: true, unit: true, currentStock: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!returnItem) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <ProductionReturnDetailClient
        initialData={returnItem}
        currentUser={session.user}
      />
    </div>
  );
}
