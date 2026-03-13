import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    {
      name: 'Admin',
      description: 'System Administrator',
      permissions: [
        "users:read", "users:write", "users:delete",
        "roles:read", "roles:write",
        "products:read", "products:write", "products:delete",
        "production_orders:read", "production_orders:write", "production_orders:delete",
        "inventory:read", "inventory:write",
        "sales:read", "sales:write"
      ],
      userRoleMapping: 'ADMIN'
    },
    {
      name: 'Accountant',
      description: 'Financial operations',
      permissions: [
        "sales:read", "sales:write", "sales:delete", "inventory:read"
      ],
      userRoleMapping: 'ACCOUNTANT'
    },
    {
      name: 'Operation Manager',
      description: 'Oversees general operations',
      permissions: [
        "users:read", "products:read", "products:write",
        "production_orders:read", "production_orders:write",
        "inventory:read", "inventory:write",
        "sales:read"
      ],
      userRoleMapping: 'OPERATION_MANAGER'
    }
  ];

  for (const roleData of roles) {
    const { userRoleMapping, ...data } = roleData;
    let role = await prisma.role.findUnique({ where: { name: data.name } });

    if (!role) {
      role = await prisma.role.create({ data });
      console.log(`Created role: ${role.name}`);
    } else {
      console.log(`Role already exists: ${role.name}`);
    }

    // Update existing users with these roles
    const updatedUsers = await prisma.user.updateMany({
      where: {
        role: userRoleMapping as any,
        appRoleId: null
      },
      data: {
        appRoleId: role.id
      }
    });

    console.log(`Updated ${updatedUsers.count} users for role ${role.name}`);
  }

  console.log('Seed completed properly.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
