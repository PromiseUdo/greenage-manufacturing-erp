import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEPARTMENTS = [
  {
    name: 'OPERATIONS',
    description: 'Handles day-to-day operations and logistics.',
  },
  {
    name: 'PRODUCTION',
    description: 'Responsible for manufacturing and assembling products.',
  },
  {
    name: 'STORE',
    description: 'Manages inventory, raw materials, and finished goods.',
  },
  {
    name: 'MANAGEMENT',
    description: 'Executive and administrative oversight.',
  },
];

async function main() {
  console.log('🌱 Starting Department Seeding...');

  // 1. Ensure all standard departments exist
  console.log('Creating exact root Departments...');
  for (const deptData of DEPARTMENTS) {
    const existingDept = await prisma.department.findUnique({
      where: { name: deptData.name },
    });

    if (!existingDept) {
      await prisma.department.create({
        data: deptData,
      });
      console.log(`✅ Created Department: ${deptData.name}`);
    } else {
      console.log(`ℹ️ Department ${deptData.name} already exists. Skipping...`);
    }
  }

  // 2. Fetch all departments and map them by name
  const allDepartments = await prisma.department.findMany();
  const departmentMap = allDepartments.reduce((acc, dept) => {
    acc[dept.name] = dept.id;
    return acc;
  }, {} as Record<string, string>);

  // 3. Migrate existing employees
  console.log('\n🔄 Checking for employees that need department migration...');
  const employeesToMigrate = await prisma.employee.findMany({
    where: { departmentId: null },
  });

  if (employeesToMigrate.length === 0) {
    console.log('✅ No employees to migrate.');
  } else {
    for (const emp of employeesToMigrate) {
      const dbDepartmentId = departmentMap[emp.department];

      if (dbDepartmentId) {
        await prisma.employee.update({
          where: { id: emp.id },
          data: { departmentId: dbDepartmentId },
        });
        console.log(`✅ Migrated employee ${emp.employeeNumber} -> Department: ${emp.department}`);
      } else {
        // Fallback for custom enum values that don't match the default 4
        const newDept = await prisma.department.upsert({
          where: { name: emp.department },
          update: {},
          create: {
            name: emp.department,
            description: `Auto-generated department from legacy employee: ${emp.employeeNumber}`,
          },
        });
        departmentMap[newDept.name] = newDept.id;
        
        await prisma.employee.update({
          where: { id: emp.id },
          data: { departmentId: newDept.id },
        });
        console.log(`⚠️ Created ad-hoc department "${emp.department}" and migrated employee ${emp.employeeNumber}`);
      }
    }
  }

  console.log('\n🎉 Department seeding and migration complete!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
