import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/courses/[id]/learn — full course with progress
export const GET = withAuth(
    async (_req: NextRequest, { params }, user) => {
        try {
            const { id: courseId } = await params;

            // Check enrollment (admin/instructor bypass)
            if (user.role === 'STUDENT') {
                const enrollment = await prisma.enrollment.findUnique({
                    where: { userId_courseId: { userId: user.id, courseId } },
                });
                if (!enrollment) return apiError('Not enrolled in this course', 403, 'NOT_ENROLLED');
            }

            const course = await prisma.course.findUnique({
                where: { id: courseId },
                include: {
                    modules: {
                        orderBy: { position: 'asc' },
                        include: {
                            lessons: {
                                orderBy: { position: 'asc' },
                            },
                        },
                    },
                },
            });

            if (!course) return apiError('Course not found', 404, 'NOT_FOUND');

            // Get progress for this student
            const allLessonIds = course.modules.flatMap((m) =>
                m.lessons.map((l) => l.id)
            );

            const completedLessons = await prisma.lessonProgress.findMany({
                where: { userId: user.id, lessonId: { in: allLessonIds } },
                select: { lessonId: true },
            });

            const completedSet = new Set(completedLessons.map((p) => p.lessonId));
            const totalLessons = allLessonIds.length;
            const completedCount = completedLessons.length;

            const modulesWithProgress = course.modules.map((mod) => {
                const modLessons = mod.lessons.map((lesson) => ({
                    ...lesson,
                    isCompleted: completedSet.has(lesson.id),
                }));
                const modTotal = modLessons.length;
                const modCompleted = modLessons.filter((l) => l.isCompleted).length;
                return {
                    ...mod,
                    lessons: modLessons,
                    progress: modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0,
                };
            });

            return apiSuccess({
                ...course,
                modules: modulesWithProgress,
                progress: totalLessons > 0
                    ? Math.round((completedCount / totalLessons) * 100)
                    : 0,
            });
        } catch (error) {
            return handleApiError(error);
        }
    }
);
