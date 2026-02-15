import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/middleware/rbac';
import prisma from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { updateProfileSchema, formatZodErrors } from '@/lib/validations';
import { apiError } from '@/lib/errors';

export const GET = withAuth(async (_req, _ctx, user) => {
    try {
        const profile = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                emailVerified: true,
                avatarUrl: true,
                createdAt: true,
            },
        });
        return apiSuccess(profile);
    } catch (error) {
        return handleApiError(error);
    }
});

export const PATCH = withAuth(async (req: NextRequest, _ctx, user) => {
    try {
        const body = await req.json();
        const parsed = updateProfileSchema.safeParse(body);
        if (!parsed.success) {
            return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
        }

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: parsed.data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
            },
        });

        return apiSuccess(updated);
    } catch (error) {
        return handleApiError(error);
    }
});
