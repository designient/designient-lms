import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { logAudit } from '@/lib/audit';

export const POST = withAuth(
    async (_req: NextRequest, { params }, user) => {
        try {
            const { id } = await params;
            const course = await prisma.course.findUnique({ where: { id } });
            if (!course) return apiError('Course not found', 404, 'NOT_FOUND');

            if (user.role === 'INSTRUCTOR' && course.createdBy !== user.id) {
                return apiError('You can only unpublish your own courses', 403, 'FORBIDDEN');
            }

            const updated = await prisma.course.update({
                where: { id },
                data: { isPublished: false },
            });

            await logAudit(user.id, 'COURSE_UNPUBLISHED', 'Course', id);

            return apiSuccess(updated);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
