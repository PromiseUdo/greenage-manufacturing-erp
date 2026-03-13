import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const companyDetails = {
    address: 'Greenage office, ECCIMA House, Garden Avenue, Enugu, Nigeria.',
    phone: '+2349060003896',
    email: 'contact@greenagetech.com',
    website: 'https://greenagetech.com',
    bankAccountNumber: '0098768081',
    bankAccountName: 'Greenage Technologies',
    bankName: 'Sterling Bank',
  };

  const existing = await prisma.companyDetails.findFirst();

  if (existing) {
    console.log('Company details already exist. Updating...');
    await prisma.companyDetails.update({
      where: { id: existing.id },
      data: companyDetails,
    });
  } else {
    console.log('Seeding company details...');
    await prisma.companyDetails.create({
      data: companyDetails,
    });
  }

  console.log('Company details seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
