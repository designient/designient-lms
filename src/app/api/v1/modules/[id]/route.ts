import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { moduleUpdateSchema, formatZodErrors } from '@/lib/validations';

export const PATCH = withAuth(
    async (req: NextRequest, { params }, user) => {
        try {
            const { id } = await params;
            const mod = await prisma.module.findUnique({
                where: { id },
                include: { course: true },
            });
            if (!mod) return apiError('Module not found', 404, 'NOT_FOUND');

            if (user.role === 'INSTRUCTOR') {
                return apiError('Mentors cannot edit live syllabus directly. Use draft flow.', 403, 'FORBIDDEN');
            }

            const body = await req.json();
            const parsed = moduleUpdateSchema.safeParse(body);
            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
            }

            const updated = await prisma.module.update({
                where: { id },
                data: parsed.data,
            });

            return apiSuccess(updated);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);

export const DELETE = withAuth(
    async (_req: NextRequest, { params }, user) => {
        try {
            const { id } = await params;
            const mod = await prisma.module.findUnique({
                where: { id },
                include: { course: true },
            });
            if (!mod) return apiError('Module not found', 404, 'NOT_FOUND');

            if (user.role === 'INSTRUCTOR') {
                return apiError('Mentors cannot edit live syllabus directly. Use draft flow.', 403, 'FORBIDDEN');
            }

            await prisma.module.delete({ where: { id } });

            return apiSuccess({ message: 'Module deleted' });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
