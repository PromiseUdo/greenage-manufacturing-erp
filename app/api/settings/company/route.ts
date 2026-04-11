import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const companyDetails = await prisma.companyDetails.findFirst();
    return NextResponse.json(companyDetails || {});
  } catch (error) {
    console.error('Error fetching company details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company details' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    // if (!session || session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const {
      address,
      phone,
      email,
      website,
      bankAccountNumber,
      bankAccountName,
      bankName,
    } = body;

    const existing = await prisma.companyDetails.findFirst();

    let updated;
    if (existing) {
      updated = await prisma.companyDetails.update({
        where: { id: existing.id },
        data: {
          address,
          phone,
          email,
          website,
          bankAccountNumber,
          bankAccountName,
          bankName,
        },
      });
    } else {
      updated = await prisma.companyDetails.create({
        data: {
          address,
          phone,
          email,
          website,
          bankAccountNumber,
          bankAccountName,
          bankName,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating company details:', error);
    return NextResponse.json(
      { error: 'Failed to update company details' },
      { status: 500 },
    );
  }
}
