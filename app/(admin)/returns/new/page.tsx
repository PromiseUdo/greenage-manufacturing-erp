import { redirect } from 'next/navigation';

export default function NewReturnPage() {
  redirect('/inventory/returns/new');
}
