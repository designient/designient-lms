import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { loginSchema, formatZodErrors } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { rateLimit } from '@/lib/middleware/rateLimit';

export async function POST(req: NextRequest) {
    try {
        const rateLimited = rateLimit(req);
        if (rateLimited) return rateLimited;

        const body = await req.json();
        const parsed = loginSchema.safeParse(body);
        if (!parsed.success) {
            return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }

        if (!user.isActive) {
            return apiError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }

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
