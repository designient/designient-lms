import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { roleUpdateSchema, formatZodErrors } from '@/lib/validations';
import { logAudit } from '@/lib/audit';

export const PATCH = withAuth(
    async (req: NextRequest, { params }, user) => {
        try {
            const { id } = await params;
            const body = await req.json();
            const parsed = roleUpdateSchema.safeParse(body);
            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
            }

            const target = await prisma.user.findUnique({ where: { id } });
            if (!target) return apiError('User not found', 404, 'NOT_FOUND');

            const updated = await prisma.user.update({
                where: { id },
                data: { role: parsed.data.role },
                select: { id: true, name: true, email: true, role: true },
            });

            await logAudit(user.id, 'ROLE_CHANGED', 'User', id, {
                from: target.role,
                to: parsed.data.role,
            });

            return apiSuccess(updated);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
