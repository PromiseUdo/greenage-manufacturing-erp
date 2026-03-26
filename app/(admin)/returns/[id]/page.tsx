import { redirect } from 'next/navigation';

export default async function ReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/inventory/returns/${id}`);
}
