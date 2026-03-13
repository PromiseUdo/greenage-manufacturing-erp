const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const latestQuote = await prisma.quote.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { lineItems: true, productionRequests: true }
  });
  console.log("Latest Quote:", JSON.stringify(latestQuote, null, 2));

  const backorders = await prisma.quoteLineItem.findMany({
    where: { backorderStatus: { in: ['PENDING', 'IN_PRODUCTION'] } },
    include: { quote: true }
  });
  console.log("Backorders count: ", backorders.length);

  const prs = await prisma.productionRequest.findMany({
    where: { status: 'PENDING' }
  });
  console.log("Pending PR count: ", prs.length);
}

check()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
