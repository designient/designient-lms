import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { logAudit } from '@/lib/audit';
import { rateLimit } from '@/lib/middleware/rateLimit';
import { z } from 'zod';
import { clearLoginAttempts, getSecurityPolicy, validatePasswordWithPolicy } from '@/lib/security-policy';

const resetSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
    try {
        const rateLimited = rateLimit(req);
        if (rateLimited) return rateLimited;

        const body = await req.json();
        const parsed = resetSchema.safeParse(body);
        if (!parsed.success) {
            return apiError('Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
        }

        const { token, password } = parsed.data;
        const policy = await getSecurityPolicy();
        const validationError = validatePasswordWithPolicy(password, policy);
        if (validationError) {
            return apiError(validationError, 422, 'VALIDATION_ERROR');
        }

        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExp: { gt: new Date() },
            },
        });

        if (!user) {
            return apiError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash,
                    resetToken: null,
                    resetTokenExp: null,
                },
            }),
            prisma.studentProfile.updateMany({
                where: {
                    userId: user.id,
                    status: 'INVITED',
                },
                data: { status: 'ACTIVE' },
            }),
        ]);

        await clearLoginAttempts(user.email.toLowerCase());

        await logAudit(user.id, 'PASSWORD_RESET', 'User', user.id);

        return apiSuccess({ message: 'Password reset successfully' });
    } catch (error) {
        return handleApiError(error);
    }
}
