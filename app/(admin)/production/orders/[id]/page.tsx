import { redirect } from "next/navigation";

export default async function ProductionOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/production/orders/${id}/overview`);
}
