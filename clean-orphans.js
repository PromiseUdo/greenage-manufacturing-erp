const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  const lineItems = await prisma.quoteLineItem.findMany();
  let orphanedLineItemsIds = [];
  for (const li of lineItems) {
    const q = await prisma.quote.findUnique({ where: { id: li.quoteId } });
    if (!q) {
      orphanedLineItemsIds.push(li.id);
    }
  }

  const prs = await prisma.productionRequest.findMany();
  let orphanedPrsIds = [];
  for (const pr of prs) {
    const q = await prisma.quote.findUnique({ where: { id: pr.quoteId } });
    if (!q) {
      orphanedPrsIds.push(pr.id);
    }
  }
  
  if (orphanedPrsIds.length > 0) {
    await prisma.productionRequest.deleteMany({
      where: { id: { in: orphanedPrsIds } }
    });
    console.log(`Deleted ${orphanedPrsIds.length} orphaned production requests.`);
  }

  if (orphanedLineItemsIds.length > 0) {
    await prisma.quoteLineItem.deleteMany({
      where: { id: { in: orphanedLineItemsIds } }
    });
    console.log(`Deleted ${orphanedLineItemsIds.length} orphaned quote line items.`);
  }
}

clean()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
