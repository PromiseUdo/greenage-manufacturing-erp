// import { Resend } from 'resend';

// export const resend = new Resend(process.env.RESEND_API_KEY!);

// export async function sendVerificationEmail(email: string, token: string) {
//   const verificationUrl = `${process.env.APP_URL}/auth/verify?token=${token}`;

//   await resend.emails.send({
//     from: process.env.EMAIL_FROM!,
//     to: email,
//     subject: 'Verify your email',
//     html: `
//       <p>Welcome to Greenage</p>
//       <p>Please verify your email by clicking the link below:</p>
//       <p>
//         <a href="${verificationUrl}">
//           Verify Email
//         </a>
//       </p>
//       <p>This link expires in 1 hour.</p>
//     `,
//   });
// }

// lib/email.ts

import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY!);

const BRAND_COLOR = '#10b981'; // Green
const BRAND_SECONDARY = '#0a1929'; // Dark blue

// Professional email template wrapper
function emailTemplate(content: string, preheader?: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      ${preheader ? `<meta name="description" content="${preheader}">` : ''}
      <title>GreenAge</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f4f4f4;
        }
        .email-wrapper {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .email-header {
          background: linear-gradient(135deg, ${BRAND_SECONDARY} 0%, ${BRAND_COLOR} 100%);
          padding: 40px 20px;
          text-align: center;
        }
        .logo {
          max-width: 180px;
          height: auto;
        }
        .email-body {
          padding: 40px 30px;
        }
        .email-title {
          font-size: 24px;
          font-weight: 700;
          color: ${BRAND_SECONDARY};
          margin: 0 0 20px 0;
        }
        .email-text {
          font-size: 16px;
          color: #555555;
          margin: 0 0 20px 0;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .button {
          display: inline-block;
          padding: 16px 40px;
          background-color: ${BRAND_COLOR};
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          transition: all 0.3s ease;
        }
        .button:hover {
          background-color: #059669;
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
        }
        .info-box {
          background-color: #f8fafc;
          border-left: 4px solid ${BRAND_COLOR};
          padding: 16px 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .warning-box {
          background-color: #fef2f2;
          border-left: 4px solid #ef4444;
          padding: 16px 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .email-footer {
          background-color: #f8fafc;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        .footer-text {
          font-size: 14px;
          color: #64748b;
          margin: 5px 0;
        }
        .footer-link {
          color: ${BRAND_COLOR};
          text-decoration: none;
        }
        .stats-container {
          display: flex;
          justify-content: space-around;
          margin: 30px 0;
          text-align: center;
        }
        .stat-item {
          flex: 1;
        }
        .stat-number {
          font-size: 32px;
          font-weight: 700;
          color: ${BRAND_COLOR};
          margin: 0;
        }
        .stat-label {
          font-size: 14px;
          color: #64748b;
          margin: 5px 0 0 0;
        }
        @media only screen and (max-width: 600px) {
          .email-body {
            padding: 30px 20px !important;
          }
          .email-title {
            font-size: 20px !important;
          }
          .button {
            display: block;
            width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        ${content}
      </div>
    </body>
    </html>
  `;
}

// Email verification
export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.APP_URL}/auth/verify?token=${token}`;

  const content = `
    <div class="email-header">
      <img src="https://res.cloudinary.com/dyckgynwo/image/upload/v1769580691/greenage_logo_white_xkyotv.png" alt="Greenage" class="logo" />
    </div>
    <div class="email-body">
      <h1 class="email-title">Welcome to Greenage Technologies</h1>
      <p class="email-text">
        Thank you for joining us in our mission to power a sustainable future. We're excited to have you on board!
      </p>
      <p class="email-text">
        Please verify your email address to activate your account and get started.
      </p>
      <div class="button-container">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </div>
      <div class="info-box">
        <p class="email-text" style="margin: 0; font-size: 14px;">
          <strong>Security Note:</strong> This verification link will expire in 1 hour for your security.
        </p>
      </div>
      <p class="email-text" style="font-size: 14px; color: #64748b;">
        If you didn't create an account with Greenage Technologies, you can safely ignore this email.
      </p>
    </div>
    <div class="email-footer">
      <p class="footer-text">
        <strong>Greenage Technologies</strong> - Delivering Energy Access
      </p>
      <p class="footer-text">
        Advanced solar battery solutions for a sustainable tomorrow
      </p>
      <p class="footer-text">
        Need help? Contact us at <a href="mailto:support@greenagetech.com" class="footer-link">support@greenagetech.com</a>
      </p>
    </div>
  `;

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: 'Verify your Greenage Tech account',
    html: emailTemplate(
      content,
      'Verify your email to get started with Greenage Technologies',
    ),
  });
}

// Password reset email
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  userName?: string,
) {
  const resetUrl = `${process.env.APP_URL}/auth/reset-password?token=${token}`;

  const content = `
    <div class="email-header">
      <img   src="https://res.cloudinary.com/dyckgynwo/image/upload/v1769580691/greenage_logo_white_xkyotv.png" alt="Greenage" class="logo" />
    </div>
    <div class="email-body">
      <h1 class="email-title">Password Reset Request</h1>
      <p class="email-text">
        ${userName ? `Hi ${userName},` : 'Hello,'}
      </p>
      <p class="email-text">
        We received a request to reset your password for your Greenage Technologies account. If you made this request, click the button below to create a new password.
      </p>
      <div class="button-container">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      <div class="warning-box">
        <p class="email-text" style="margin: 0; font-size: 14px;">
          <strong>Important:</strong> This password reset link will expire in 1 hour for security reasons.
        </p>
      </div>
      <p class="email-text" style="font-size: 14px; color: #64748b;">
        If you didn't request a password reset, please ignore this email or contact our support team if you're concerned about your account security.
      </p>
      <div class="info-box">
        <p class="email-text" style="margin: 0; font-size: 14px;">
          <strong>Security Tip:</strong> Never share your password with anyone. Greenage Technologies will never ask for your password via email.
        </p>
      </div>
    </div>
    <div class="email-footer">
      <p class="footer-text">
        <strong>Greenage Technologies</strong> - Delivering Energy Access
      </p>
      <p class="footer-text">
        Advanced solar battery solutions for a sustainable tomorrow
      </p>
      <p class="footer-text">
        Need help? Contact us at <a href="mailto:support@greenagetech.com" class="footer-link">support@greenagetech.com</a>
      </p>
      <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
        This email was sent to ${email}
      </p>
    </div>
  `;

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: 'Reset your GreenAge password',
    html: emailTemplate(
      content,
      'Reset your password to regain access to your account',
    ),
  });
}

// Password reset success confirmation
export async function sendPasswordResetConfirmation(
  email: string,
  userName?: string,
) {
  const content = `
    <div class="email-header">
      <img src="https://res.cloudinary.com/dyckgynwo/image/upload/v1769580691/greenage_logo_white_xkyotv.png" alt="GreenAge" class="logo" />
    </div>
    <div class="email-body">
      <h1 class="email-title">Password Successfully Reset ✓</h1>
      <p class="email-text">
        ${userName ? `Hi ${userName},` : 'Hello,'}
      </p>
      <p class="email-text">
        This is a confirmation that your GreenAge account password has been successfully reset.
      </p>
      <p class="email-text">
        You can now sign in to your account using your new password.
      </p>
      <div class="button-container">
        <a href="${process.env.APP_URL}/auth/signin" class="button">Sign In to Your Account</a>
      </div>
      <div class="warning-box">
        <p class="email-text" style="margin: 0; font-size: 14px;">
          <strong>⚠️ Didn't make this change?</strong> If you didn't reset your password, please contact our support team immediately at <a href="mailto:support@greenage.com" class="footer-link">support@greenage.com</a>
        </p>
      </div>
    </div>
    <div class="email-footer">
      <p class="footer-text">
        <strong>GreenAge</strong> - Powering the Future
      </p>
      <p class="footer-text">
        Need help? Contact us at <a href="mailto:support@greenage.com" class="footer-link">support@greenage.com</a>
      </p>
    </div>
  `;

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: 'Your GreenAge password has been reset',
    html: emailTemplate(content, 'Your password has been successfully reset'),
  });
}
