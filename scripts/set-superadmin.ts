/**
 * One-time script: promotes greenagetechnologies@gmail.com to SUPERADMIN.
 *
 * Run with:
 *   npx tsx scripts/set-superadmin.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SUPERADMIN_EMAILS = [
  'greenagetechnologies@gmail.com',
  'coderstriangle@gmail.com',
  'info.promiseudo@gmail.com',
];

async function main() {
  for (const email of SUPERADMIN_EMAILS) {
    try {
      const user = await prisma.user.update({
        where: { email },
        data: { role: 'SUPERADMIN' },
        select: { id: true, name: true, email: true, role: true },
      });
      console.log(`✅ ${user.name} (${user.email}) → ${user.role}`);
    } catch {
      console.warn(`⚠️  No account found for ${email} — skipping.`);
    }
  }
}

main()
  .catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
