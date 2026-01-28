// // src/app/api/auth/change-password/route.ts

// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { auth } from '@/lib/auth';
// import bcrypt from 'bcryptjs';

// export async function POST(request: NextRequest) {
//   try {
//     const session = await auth();

//     if (!session) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const body = await request.json();
//     const { currentPassword, newPassword } = body;

//     if (!currentPassword || !newPassword) {
//       return NextResponse.json(
//         { error: 'Current password and new password are required' },
//         { status: 400 },
//       );
//     }

//     if (newPassword.length < 6) {
//       return NextResponse.json(
//         { error: 'New password must be at least 6 characters' },
//         { status: 400 },
//       );
//     }

//     // Get current user
//     const user = await prisma.user.findUnique({
//       where: { id: session.user.id },
//       include: {
//         employee: true,
//       },
//     });

//     if (!user) {
//       return NextResponse.json({ error: 'User not found' }, { status: 404 });
//     }

//     // Verify current password
//     const isPasswordValid = await bcrypt.compare(
//       currentPassword,
//       user.password,
//     );

//     if (!isPasswordValid) {
//       return NextResponse.json(
//         { error: 'Current password is incorrect' },
//         { status: 400 },
//       );
//     }

//     // Hash new password
//     const hashedPassword = await bcrypt.hash(newPassword, 12);

//     // Update password
//     await prisma.$transaction(async (tx) => {
//       // Update user password
//       await tx.user.update({
//         where: { id: user.id },
//         data: {
//           password: hashedPassword,
//         },
//       });

//       // Update employee record if exists
//       if (user.employee) {
//         await tx.employee.update({
//           where: { id: user.employee.id },
//           data: {
//             mustChangePassword: false,
//             lastPasswordChange: new Date(),
//           },
//         });
//       }
//     });

//     // Log activity
//     await prisma.activityLog.create({
//       data: {
//         userId: user.id,
//         action: 'Changed Password',
//         module: 'Authentication',
//         details: {
//           changedAt: new Date(),
//         },
//       },
//     });

//     return NextResponse.json({
//       message: 'Password changed successfully',
//     });
//   } catch (error) {
//     console.error('Error changing password:', error);
//     return NextResponse.json(
//       { error: 'Failed to change password' },
//       { status: 500 },
//     );
//   }
// }

// src/app/api/auth/change-password/route.ts
// UPDATED - Triggers session refresh after password change

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 },
      );
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        employee: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 },
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.$transaction(async (tx) => {
      // Update user password
      await tx.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
        },
      });

      // Update employee record if exists
      if (user.employee) {
        await tx.employee.update({
          where: { id: user.employee.id },
          data: {
            mustChangePassword: false, // ✅ Clear flag
            lastPasswordChange: new Date(),
          },
        });
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'Changed Password',
        module: 'Authentication',
        details: {
          changedAt: new Date(),
        },
      },
    });

    return NextResponse.json({
      message: 'Password changed successfully',
      // ✅ Tell client to refresh session
      refreshSession: true,
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 },
    );
  }
}
