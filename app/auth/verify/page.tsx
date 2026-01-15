// app/auth/verify/page.tsx
import { redirect } from 'next/navigation';
interface VerifyPageProps {
  searchParams: { token?: string } | Promise<{ token?: string }>;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams; // ✅ unwrap the promise
  const token = params.token;

  if (!token) return <p>Invalid verification link</p>;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify?token=${token}`,
    { cache: 'no-store' }
  );

  if (!res.ok) return <p>Verification failed or token expired.</p>;

  redirect('/auth/signin?verified=true');
}
