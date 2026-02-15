import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@lms.local',
        to: email,
        subject: 'Reset Your Password — LMS',
        html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>If you didn't request this, please ignore this email.</p>
    `,
    });
}

export async function sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${APP_URL}/api/v1/auth/verify?token=${token}`;
    await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@lms.local',
        to: email,
        subject: 'Verify Your Email — LMS',
        html: `
      <h2>Email Verification</h2>
      <p>Click the link below to verify your email address.</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
    `,
    });
}
