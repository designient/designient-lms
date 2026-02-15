import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { logAudit } from '@/lib/audit';

export const POST = withAuth(
    async (_req: NextRequest, { params }, user) => {
        try {
            const { id: courseId } = await params;

            const course = await prisma.course.findUnique({ where: { id: courseId } });
            if (!course) return apiError('Course not found', 404, 'NOT_FOUND');
            if (!course.isPublished) return apiError('Course is not available', 400, 'COURSE_UNPUBLISHED');

            const existing = await prisma.enrollment.findUnique({
                where: { userId_courseId: { userId: user.id, courseId } },
            });
            if (existing) return apiError('Already enrolled', 409, 'ALREADY_ENROLLED');

            const enrollment = await prisma.enrollment.create({
                data: { userId: user.id, courseId },
            });

            await logAudit(user.id, 'ENROLLED', 'Enrollment', enrollment.id, { courseId });

            return apiSuccess(enrollment, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['STUDENT']
);
