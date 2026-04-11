// src/app/api/employees/[id]/route.ts
// UPDATED FOR NORMALIZED SCHEMA

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { isAdminOrSuperAdmin, isSuperAdmin } from '@/lib/permissions';
import { updateEmployee } from '@/services/employee.service';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const params = await context.params;
  const { id } = params;

  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminOrSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
      { status: 500 },
    );
  }
}

// export async function PATCH(
//   request: NextRequest,
//   context: { params: { id: string } | Promise<{ id: string }> },
// ) {
//   const params = await context.params;
//   const { id } = params;

//   try {
//     const session = await auth();

//     if (!session) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     if (!isSuperAdmin(session.user.role)) {
//       return NextResponse.json(
//         { error: 'Only the superadmin can edit employees.' },
//         { status: 403 },
//       );
//     }

//     const body = await request.json();
//     const {
//       name,
//       phone,
//       address,
//       departmentId,
//       position,
//       appRoleId,
//       isActive,
//       notes,
//     } = body;

//     const employee = await prisma.employee.findUnique({
//       where: { id },
//       include: { user: true },
//     });

//     if (!employee) {
//       return NextResponse.json(
//         { error: 'Employee not found' },
//         { status: 404 },
//       );
//     }

//     // Update Employee and User in transaction
//     const updated = await prisma.$transaction(async (tx) => {
//       // Fetch department name if departmentId is provided
//       let departmentName = undefined;
//       if (departmentId) {
//         const dbDepartment = await tx.department.findUnique({
//           where: { id: departmentId },
//         });
//         if (dbDepartment) {
//           departmentName = dbDepartment.name;
//         }
//       }

//       // Update Employee record
//       await tx.employee.update({
//         where: { id },
//         data: {
//           ...(phone && { phone }),
//           ...(address !== undefined && { address }),
//           ...(departmentName && { department: departmentName }),
//           ...(departmentId && { departmentId }),
//           ...(position !== undefined && { position }),
//           ...(appRoleId && { appRoleId }),
//           ...(isActive !== undefined && { isActive }),
//           ...(notes !== undefined && { notes }),
//         },
//       });

//       // Update User record (name, isActive)
//       await tx.user.update({
//         where: { id: employee.userId },
//         data: {
//           ...(name && { name }),
//           ...(isActive !== undefined && { isActive }),
//         },
//       });

//       // Return employee with updated user info
//       return await tx.employee.findUnique({
//         where: { id },
//         include: {
//           user: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               role: true,
//               isActive: true,
//             },
//           },
//           appRole: {
//             select: { name: true },
//           },
//         },
//       });
//     });

//     await prisma.activityLog.create({
//       data: {
//         userId: session.user.id,
//         action: 'Updated Employee',
//         module: 'Staff Management',
//         details: {
//           employeeId: id,
//           employeeNumber: employee.employeeNumber,
//           changes: body,
//         },
//       },
//     });

//     return NextResponse.json(updated);
//   } catch (error) {
//     console.error('Error updating employee:', error);
//     return NextResponse.json(
//       { error: 'Failed to update employee' },
//       { status: 500 },
//     );
//   }
// }

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const params = await context.params;
  const { id } = params;
  try {
    // 🔐 AUTH
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Only the superadmin can edit employees.' },
        { status: 403 },
      );
    }

    const body = await request.json();

    // 🧠 BASIC VALIDATION
    if (!body.name || !body.phone || !body.departmentId || !body.appRoleId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const updated = await updateEmployee(params.id, body);

    // 📝 Activity Log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Updated Employee',
        module: 'Staff Management',
        details: {
          employeeId: params.id,
          changes: body,
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PATCH employee error:', error);

    if (error.message === 'Employee not found') {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const params = await context.params;
  const { id } = params;

  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Only the superadmin can deactivate employees.' },
        { status: 403 },
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 },
      );
    }

    // // Soft delete - deactivate employee and user
    // await prisma.$transaction(async (tx) => {
    //   // Deactivate employee
    //   await tx.employee.update({
    //     where: { id },
    //     data: {
    //       isActive: false,
    //       dateTerminated: new Date(),
    //     },
    //   });

    //   // Deactivate user account
    //   await tx.user.update({
    //     where: { id: employee.userId },
    //     data: { isActive: false },
    //   });
    // });

    await prisma.user.update({
      where: { id: employee.userId },
      data: { isActive: false },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'Deactivated Employee',
        module: 'Staff Management',
        details: {
          employeeId: id,
          employeeNumber: employee.employeeNumber,
          name: employee.user.name,
        },
      },
    });

    return NextResponse.json({
      message: 'Employee deactivated successfully',
    });
  } catch (error) {
    console.error('Error deactivating employee:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate employee' },
      { status: 500 },
    );
  }
}
