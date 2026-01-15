// import { NextRequest, NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client';
// import bcrypt from 'bcryptjs';
// import crypto from 'crypto';
// import nodemailer from 'nodemailer';

// const prisma = new PrismaClient();

// async function sendVerificationEmail(email: string, token: string) {
//   // Same as in register route (reuse or extract to util)
//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST || 'smtp.ethereal.email',
//     port: Number(process.env.SMTP_PORT) || 587,
//     secure: false,
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });

//   const verificationUrl = `${process.env.APP_URL}/api/verify-email?token=${token}`;

//   await transporter.sendMail({
//     from: '"GreenAge" <no-reply@yourdomain.com>',
//     to: email,
//     subject: 'Verify Your Email',
//     html: `
//       <p>Please verify your email by clicking the link below:</p>
//       <a href="${verificationUrl}">Verify Email</a>
//       <p>This link expires in 1 hour.</p>
//     `,
//   });
// }

// export async function POST(req: NextRequest) {
//   try {
//     const { email } = await req.json();

//     if (!email) {
//       return NextResponse.json({ error: 'Email required' }, { status: 400 });
//     }

//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user) {
//       return NextResponse.json({ error: 'User not found' }, { status: 404 });
//     }
//     if (user.isVerified) {
//       return NextResponse.json(
//         { error: 'Email already verified' },
//         { status: 400 }
//       );
//     }

//     // Generate new token
//     const token = crypto.randomBytes(32).toString('hex');
//     const hashedToken = bcrypt.hashSync(token, 10);
//     const expiry = new Date(Date.now() + 60 * 60 * 1000);

//     await prisma.user.update({
//       where: { id: user.id },
//       data: {
//         verificationToken: hashedToken,
//         verificationTokenExpiry: expiry,
//       },
//     });

//     await sendVerificationEmail(email, token);

//     return NextResponse.json(
//       { message: 'Verification email resent' },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error('Resend error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// src/app/api/auth/resend-verification/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const resend = new Resend(process.env.RESEND_API_KEY!);

async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.APP_URL}/auth/verify?token=${token}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM!, // e.g. "GreenAge <no-reply@greenage.com>"
    to: email,
    subject: 'Verify your email',
    html: `
      <p>Welcome to GreenAge 👋</p>
      <p>Please verify your email by clicking the link below:</p>
      <p>
        <a href="${verificationUrl}">Verify Email</a>
      </p>
      <p>This link expires in 1 hour.</p>
    `,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      );
    }

    // Generate new verification token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(token, 10);
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: hashedToken,
        verificationTokenExpiry: expiry,
      },
    });

    await sendVerificationEmail(email, token);

    return NextResponse.json(
      { message: 'Verification email resent' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
