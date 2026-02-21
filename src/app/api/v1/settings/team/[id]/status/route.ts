import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { logAudit } from '@/lib/audit';

const teamStatusSchema = z.object({
    isActive: z.boolean(),
});

// PATCH /api/v1/settings/team/[id]/status - activate/deactivate team member
export const PATCH = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;
            if (!id) return apiError('Team member id is required', 400, 'VALIDATION_ERROR');

            const body = await req.json();
            const parsed = teamStatusSchema.safeParse(body);
            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            }

            const target = await prisma.user.findUnique({
                where: { id },
                select: { id: true, role: true, name: true, email: true, avatarUrl: true, passwordHash: true, createdAt: true },
            });

            if (!target || !['ADMIN', 'INSTRUCTOR'].includes(target.role)) {
                return apiError('Team member not found', 404, 'NOT_FOUND');
            }

            if (user.id === target.id && !parsed.data.isActive) {
                return apiError('You cannot deactivate your own account', 400, 'INVALID_OPERATION');
            }

            const updated = await prisma.user.update({
                where: { id: target.id },
                data: { isActive: parsed.data.isActive },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    avatarUrl: true,
                    isActive: true,
                    passwordHash: true,
                    resetToken: true,
                    resetTokenExp: true,
                    createdAt: true,
                },
            });

            await logAudit(user.id, updated.isActive ? 'TEAM_MEMBER_ACTIVATED' : 'TEAM_MEMBER_DEACTIVATED', 'User', updated.id);

            const now = new Date();
            const status = !updated.isActive
                ? 'DEACTIVATED'
                : updated.passwordHash === 'PENDING_SETUP' || (updated.resetToken && updated.resetTokenExp && updated.resetTokenExp > now)
                    ? 'INVITED'
                    : 'ACTIVE';

            return apiSuccess({
                id: updated.id,
                name: updated.name,
                email: updated.email,
                role: updated.role,
                avatarUrl: updated.avatarUrl,
                isActive: updated.isActive,
                status,
                createdAt: updated.createdAt,
            });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
