import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { loginSchema, formatZodErrors } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { rateLimit } from '@/lib/middleware/rateLimit';
import { clearLoginAttempts, getLoginAttemptState, getSecurityPolicy, registerFailedLoginAttempt } from '@/lib/security-policy';

export async function POST(req: NextRequest) {
    try {
        const rateLimited = rateLimit(req);
        if (rateLimited) return rateLimited;

        const body = await req.json();
        const parsed = loginSchema.safeParse(body);
        if (!parsed.success) {
            return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
        }

        const emailInput = parsed.data.email.trim();
        const attemptKey = emailInput.toLowerCase();
        const { password } = parsed.data;
        const policy = await getSecurityPolicy();
        const attemptState = await getLoginAttemptState(attemptKey);
        if (attemptState.isLocked) {
            return apiError('Too many failed attempts. Please try again later.', 429, 'ACCOUNT_LOCKED');
        }

        const user = await prisma.user.findFirst({
            where: { email: { equals: emailInput, mode: 'insensitive' } },
        });
        if (!user) {
            await registerFailedLoginAttempt(attemptKey, policy.maxLoginAttempts, policy.lockoutMinutes);
            return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }

        if (!user.isActive) {
            await registerFailedLoginAttempt(attemptKey, policy.maxLoginAttempts, policy.lockoutMinutes);
            return apiError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            await registerFailedLoginAttempt(attemptKey, policy.maxLoginAttempts, policy.lockoutMinutes);
            return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }

        await clearLoginAttempts(attemptKey);

        await logAudit(user.id, 'LOGIN', 'User', user.id);

        return apiSuccess({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            emailVerified: user.emailVerified,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
