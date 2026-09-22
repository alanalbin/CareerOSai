import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM || "Career OS <no-reply@careeros.app>";

let transporter: nodemailer.Transporter | null = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
}

export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const verifyUrl = `${process.env.APP_URL || "http://localhost:3000"}/verify-email?token=${token}`;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject: "Verify your email - Career OS",
        text: `Welcome to Career OS! Please verify your email address by visiting: ${verifyUrl}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #14221f;">
            <h2>Welcome to Career OS</h2>
            <p>Thank you for registering. Please click below to verify your email address:</p>
            <p><a href="${verifyUrl}" style="display: inline-block; background: #135f52; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Verify Email</a></p>
            <p style="font-size: 12px; color: #72847d;">Or copy this link: ${verifyUrl}</p>
          </div>
        `,
      });
      return true;
    } catch (err) {
      console.warn("[EmailService] Failed to send verification email via SMTP:", err);
    }
  }

  // Fallback to console in development
  console.log(`\n======================================================`);
  console.log(`[Email Service - Dev Mode] Verification email to: ${email}`);
  console.log(`Verification URL: ${verifyUrl}`);
  console.log(`======================================================\n`);
  return true;
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const resetUrl = `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject: "Password Reset - Career OS",
        text: `You requested a password reset. Reset your password at: ${resetUrl}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #14221f;">
            <h2>Reset Your Password</h2>
            <p>You requested a password reset for your Career OS account. Click below to proceed:</p>
            <p><a href="${resetUrl}" style="display: inline-block; background: #135f52; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
            <p style="font-size: 12px; color: #72847d;">This link will expire in 1 hour.</p>
          </div>
        `,
      });
      return true;
    } catch (err) {
      console.warn("[EmailService] Failed to send password reset via SMTP:", err);
    }
  }

  console.log(`\n======================================================`);
  console.log(`[Email Service - Dev Mode] Password reset email to: ${email}`);
  console.log(`Reset URL: ${resetUrl}`);
  console.log(`======================================================\n`);
  return true;
}
