const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const lineItems = await prisma.quoteLineItem.findMany();
  let orphanedLineItems = 0;
  for (const li of lineItems) {
    const q = await prisma.quote.findUnique({ where: { id: li.quoteId } });
    if (!q) {
      console.log('Orphaned QuoteLineItem:', li.id, 'missing quoteId:', li.quoteId);
      orphanedLineItems++;
    }
  }

  const prs = await prisma.productionRequest.findMany();
  let orphanedPrs = 0;
  for (const pr of prs) {
    const q = await prisma.quote.findUnique({ where: { id: pr.quoteId } });
    if (!q) {
      console.log('Orphaned ProductionRequest:', pr.id, 'missing quoteId:', pr.quoteId);
      orphanedPrs++;
    }
  }

  console.log(`Found ${orphanedLineItems} orphaned quote line items and ${orphanedPrs} orphaned production requests.`);
}

check()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
