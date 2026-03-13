import { prisma } from '@/lib/prisma';
import ReturnForm from './components/return-form';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function NewReturnPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  // Fetch data needed for dropdowns
  const customers = await prisma.customer.findMany({
    select: { id: true, name: true, phone: true }
  });
  
  const products = await prisma.product.findMany({
    select: { id: true, name: true, productNumber: true, productCode: true }
  });
  
  const orders = await prisma.order.findMany({
    select: { id: true, orderNumber: true, status: true },
    orderBy: { createdAt: 'desc' },
    take: 100 // Limit for performance, might need a search API in a real robust system
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <ReturnForm 
        customers={customers} 
        products={products} 
        orders={orders} 
      />
    </div>
  );
}
