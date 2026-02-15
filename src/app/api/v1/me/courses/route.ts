import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/me/courses — student's enrolled courses with progress
export const GET = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            const { searchParams } = req.nextUrl;
            const page = Math.max(1, Number(searchParams.get('page') || '1'));
            const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '12')));

            const [enrollments, total] = await Promise.all([
                prisma.enrollment.findMany({
                    where: { userId: user.id },
                    include: {
                        course: {
                            include: {
                                creator: { select: { name: true } },
                                modules: {
                                    include: {
                                        lessons: { select: { id: true } },
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { enrolledAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma.enrollment.count({ where: { userId: user.id } }),
            ]);

            // Calculate progress for each course
            const coursesWithProgress = await Promise.all(
                enrollments.map(async (enrollment) => {
                    const lessonIds = enrollment.course.modules.flatMap((m) =>
                        m.lessons.map((l) => l.id)
                    );
                    const totalLessons = lessonIds.length;

                    const completed = totalLessons > 0
                        ? await prisma.lessonProgress.count({
                            where: { userId: user.id, lessonId: { in: lessonIds } },
                        })
                        : 0;

                    return {
                        id: enrollment.id,
                        enrolledAt: enrollment.enrolledAt,
                        status: enrollment.status,
                        course: {
                            id: enrollment.course.id,
                            title: enrollment.course.title,
                            slug: enrollment.course.slug,
                            description: enrollment.course.description,
                            level: enrollment.course.level,
                            creator: enrollment.course.creator,
                        },
                        progress: totalLessons > 0
                            ? Math.round((completed / totalLessons) * 100)
                            : 0,
                        totalLessons,
                        completedLessons: completed,
                    };
                })
            );

            return apiSuccess({
                courses: coursesWithProgress,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            });
        } catch (error) {
            return handleApiError(error);
        }
    }
);
