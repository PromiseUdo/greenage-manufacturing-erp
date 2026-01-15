import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import React from 'react';

const page = async () => {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  return <div>Orders Management</div>;
};

export default page;
