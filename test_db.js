const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const prs = await prisma.productionRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("Production Requests:", prs);
}

main().catch(console.error).finally(() => prisma.$disconnect());
