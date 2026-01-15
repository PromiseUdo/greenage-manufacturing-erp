import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.APP_URL}/auth/verify?token=${token}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: 'Verify your email',
    html: `
      <p>Welcome to Greenage</p>
      <p>Please verify your email by clicking the link below:</p>
      <p>
        <a href="${verificationUrl}">
          Verify Email
        </a>
      </p>
      <p>This link expires in 1 hour.</p>
    `,
  });
}
