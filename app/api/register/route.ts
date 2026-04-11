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
        { status: 409 },
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
        role: 'EMPLOYEE',
      },
    });

    await sendVerificationEmail(email, token);

    return NextResponse.json(
      { message: 'Check your email to verify your account' },
      { status: 201 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
