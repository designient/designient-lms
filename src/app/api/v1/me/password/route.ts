import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { changePasswordSchema, formatZodErrors } from '@/lib/validations';
import { withAuth } from '@/lib/middleware/rbac';

// POST /api/v1/me/password — change password for authenticated user
export const POST = withAuth(async (req: NextRequest, _ctx, user) => {
    try {
        const body = await req.json();
        const parsed = changePasswordSchema.safeParse(body);
        if (!parsed.success) {
            return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
        }

        const { currentPassword, newPassword } = parsed.data;

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { passwordHash: true },
        });

        if (!dbUser?.passwordHash) {
            return apiError('User not found', 404, 'NOT_FOUND');
        }

        const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
        if (!isValid) {
            return apiError('Current password is incorrect', 400, 'INVALID_PASSWORD');
        }

        const newHash = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newHash },
        });

        return apiSuccess({ message: 'Password changed successfully' });
    } catch (error) {
        return handleApiError(error);
    }
});
