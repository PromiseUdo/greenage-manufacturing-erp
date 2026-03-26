const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDuplicates() {
  const tools = await prisma.tool.findMany();
  const seen = new Set();
  for (const tool of tools) {
    if (seen.has(tool.toolId)) {
      console.log('Deleting duplicate tool:', tool.id, tool.toolId);
      await prisma.tool.delete({ where: { id: tool.id } });
    } else {
      seen.add(tool.toolId);
    }
  }
  console.log('Done cleaning tools');
}

cleanDuplicates().catch(console.error).finally(() => prisma.$disconnect());
