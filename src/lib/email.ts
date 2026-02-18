import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
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

export async function sendInvitationEmail(
    email: string,
    token: string,
    role: string,
    name: string
) {
    const setupUrl = `${APP_URL}/auth/setup-account?token=${token}`;
    const roleName = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

    await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@lms.local',
        to: email,
        subject: `You have been invited to join LMS as a ${roleName}`,
        html: `
      <h2>Welcome, ${name}!</h2>
      <p>You have been invited to join the platform as a <strong>${roleName}</strong>.</p>
      <p>To get started, please click the link below to set up your password and access your account:</p>
      <a href="${setupUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">Set Up Account</a>
      <p>Or copy this link: <br /> <a href="${setupUrl}">${setupUrl}</a></p>
      <p>This link will expire in 24 hours.</p>
    `,
    });
}

// Verify SMTP connection configuration
try {
    transporter.verify((error, success) => {
        if (error) {
            console.error('SMTP Connection Error:', error);
        } else {
            // SMTP Server is ready
        }
    });
} catch (error) {
    console.error('SMTP Verification failed synchronously:', error);
}
