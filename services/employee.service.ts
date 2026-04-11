import { prisma } from '@/lib/prisma';

export async function updateEmployee(id: string, data: any) {
  console.log('====================================');
  console.log(id, id);
  console.log('====================================');
  const employee = await prisma.employee.findUnique({
    where: { id },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  return prisma.$transaction(async (tx) => {
    // ✅ Update Employee
    await tx.employee.update({
      where: { id },
      data: {
        phone: data.phone,
        address: data.address,
        departmentId: data.departmentId,
        appRoleId: data.appRoleId,
        notes: data.notes,
      },
    });

    // ✅ Update User (ONLY place for isActive)
    await tx.user.update({
      where: { id: employee.userId },
      data: {
        name: data.name,
        isActive: data.isActive,
      },
    });

    return tx.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        appRole: {
          select: { id: true, name: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
    });
  });
}
