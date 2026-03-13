import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    const companyDetails = await prisma.companyDetails.findFirst();
    console.log('Company Details:', JSON.stringify(companyDetails, null, 2));
  } catch (error) {
    console.error('Error fetching company details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
