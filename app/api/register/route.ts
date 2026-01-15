// // import { NextRequest, NextResponse } from 'next/server';
// // import { PrismaClient } from '@prisma/client';
// // import bcrypt from 'bcryptjs';

// // const prisma = new PrismaClient();

// // export async function POST(req: NextRequest) {
// //   try {
// //     const { name, email, password } = await req.json();

// //     if (!name || !email || !password) {
// //       return NextResponse.json(
// //         { error: 'Missing required fields' },
// //         { status: 400 }
// //       );
// //     }

// //     // Check if user exists
// //     const existingUser = await prisma.user.findUnique({ where: { email } });
// //     if (existingUser) {
// //       return NextResponse.json(
// //         { error: 'Email already in use' },
// //         { status: 409 }
// //       );
// //     }

// //     // Hash password
// //     const hashedPassword = bcrypt.hashSync(password, 10);

// //     // Create user
// //     const user = await prisma.user.create({
// //       data: {
// //         name,
// //         email,
// //         password: hashedPassword,
// //         role: 'ADMIN',
// //       },
// //     });

// //     return NextResponse.json(
// //       {
// //         message: 'User created successfully',
// //         user: { id: user.id, name: user.name, email: user.email },
// //       },
// //       { status: 201 }
// //     );
// //   } catch (error) {
// //     console.error('Registration error:', error);
// //     return NextResponse.json(
// //       { error: 'Internal server error' },
// //       { status: 500 }
// //     );
// //   } finally {
// //     await prisma.$disconnect();
// //   }
// // }

// import { NextRequest, NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client';
// import bcrypt from 'bcryptjs';
// import crypto from 'crypto'; // For token generation
// import nodemailer from 'nodemailer'; // New: For sending emails

// const prisma = new PrismaClient();

// async function sendVerificationEmail(email: string, token: string) {
//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST || 'smtp.ethereal.email', // Use your SMTP host
//     port: Number(process.env.SMTP_PORT) || 587,
//     secure: false, // true for 465, false for other ports
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });

//   const verificationUrl = `${process.env.APP_URL}/api/verify-email?token=${token}`;

//   await transporter.sendMail({
//     from: '"Greenage" <no-reply@yourdomain.com>', // Sender address
//     to: email,
//     subject: 'Verify Your Email',
//     html: `
//       <p>Thank you for signing up! Please verify your email by clicking the link below:</p>
//       <a href="${verificationUrl}">Verify Email</a>
//       <p>This link expires in 1 hour. If you didn't sign up, ignore this email.</p>
//     `,
//   });
// }

// export async function POST(req: NextRequest) {
//   try {
//     const { name, email, password } = await req.json();

//     if (!name || !email || !password) {
//       return NextResponse.json(
//         { error: 'Missing required fields' },
//         { status: 400 }
//       );
//     }

//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) {
//       return NextResponse.json(
//         { error: 'Email already in use' },
//         { status: 409 }
//       );
//     }

//     const hashedPassword = bcrypt.hashSync(password, 10);
//     const token = crypto.randomBytes(32).toString('hex'); // Plain token for email
//     const hashedToken = bcrypt.hashSync(token, 10); // Hashed for DB
//     const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

//     const user = await prisma.user.create({
//       data: {
//         name,
//         email,
//         password: hashedPassword,
//         verificationToken: hashedToken,
//         verificationTokenExpiry: expiry,
//         isVerified: false,
//         role: 'ADMIN',
//       },
//     });

//     // Send email
//     await sendVerificationEmail(email, token);

//     return NextResponse.json(
//       {
//         message: 'User created. Check your email to verify.',
//         user: { id: user.id, name: user.name, email: user.email },
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error('Registration error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // 🔐 token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verificationToken: tokenHash,
        verificationTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
        isVerified: false,
        role: 'ADMIN',
      },
    });

    await sendVerificationEmail(email, token);

    return NextResponse.json(
      { message: 'Check your email to verify your account' },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
