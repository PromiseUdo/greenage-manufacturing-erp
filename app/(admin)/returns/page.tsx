import { prisma } from '@/lib/prisma';
import ReturnsClient from './components/returns-client';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ReturnsPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  const returns = await prisma.productReturn.findMany({
    include: {
      customer: true,
      product: true,
      receivedBy: true,
      handledBy: true,
      recommendedBy: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <ReturnsClient data={returns} />
    </div>
  );
}
