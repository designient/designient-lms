import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// POST /api/v1/lessons/[id]/complete
export const POST = withAuth(
    async (_req: NextRequest, { params }, user) => {
        try {
            const { id: lessonId } = await params;

            const lesson = await prisma.lesson.findUnique({
                where: { id: lessonId },
                include: { module: { include: { course: true } } },
            });
            if (!lesson) return apiError('Lesson not found', 404, 'NOT_FOUND');

            // Check enrollment (admin/instructor bypass)
            if (user.role === 'STUDENT') {
                const enrollment = await prisma.enrollment.findUnique({
                    where: {
                        userId_courseId: {
                            userId: user.id,
                            courseId: lesson.module.course.id,
                        },
                    },
                });
                if (!enrollment) return apiError('Not enrolled', 403, 'NOT_ENROLLED');
            }

            // Upsert progress
            const progress = await prisma.lessonProgress.upsert({
                where: { userId_lessonId: { userId: user.id, lessonId } },
                create: { userId: user.id, lessonId },
                update: { completedAt: new Date() },
            });

            return apiSuccess(progress);
        } catch (error) {
            return handleApiError(error);
        }
    }
);
