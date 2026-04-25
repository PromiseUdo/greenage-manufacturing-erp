import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ONE-TIME USE — delete this file after running it once in production.
export async function POST() {
  const lastItem = await prisma.storeItem.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { itemNumber: true },
  });
  const itemSeq = lastItem
    ? parseInt(lastItem.itemNumber.split('-')[1])
    : 0;

  const lastReceipt = await prisma.storeReceipt.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { receiptNumber: true },
  });
  const receiptSeq = lastReceipt
    ? parseInt(lastReceipt.receiptNumber.split('-')[2])
    : 0;

  await prisma.$runCommandRaw({
    insert: 'counters',
    documents: [
      { _id: 'storeItem', seq: itemSeq },
      { _id: 'storeReceipt', seq: receiptSeq },
    ],
  });

  return NextResponse.json({
    seeded: { storeItem: itemSeq, storeReceipt: receiptSeq },
    message: 'Counters seeded. Delete this route file now.',
  });
}
