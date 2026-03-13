import { prisma } from '@/lib/prisma';
import ReturnDetailClient from '../../../returns/[id]/components/return-detail-client';
import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';

export default async function ProductionReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
      receivedBy: true,
      handledBy: true,
      recommendedBy: true,
      order: true,
      materialRequisitions: {
          include: {
            items: {
              include: {
                material: {
                  select: { name: true, unit: true, partNumber: true, currentStock: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!returnItem) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <ReturnDetailClient initialData={returnItem} currentUser={session.user} isProductionView />
    </div>
  );
}
