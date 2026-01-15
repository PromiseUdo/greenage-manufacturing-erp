// src/app/dashboard/inventory/page.tsx (SERVER)
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import InventoryDashboardClient from './components/inventory-client';

export default async function InventoryPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  return <InventoryDashboardClient />;
}
