import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { activeUpdateSchema, formatZodErrors } from '@/lib/validations';
import { logAudit } from '@/lib/audit';

export const PATCH = withAuth(
    async (req: NextRequest, { params }, user) => {
        try {
            const { id } = await params;
            const body = await req.json();
            const parsed = activeUpdateSchema.safeParse(body);
            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
            }

            const target = await prisma.user.findUnique({ where: { id } });
            if (!target) return apiError('User not found', 404, 'NOT_FOUND');

            if (target.id === user.id) {
                return apiError('Cannot deactivate your own account', 400, 'SELF_DEACTIVATION');
            }

            const updated = await prisma.user.update({
                where: { id },
                data: { isActive: parsed.data.isActive },
                select: { id: true, name: true, email: true, isActive: true },
            });

            await logAudit(user.id, parsed.data.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', 'User', id);

            return apiSuccess(updated);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
