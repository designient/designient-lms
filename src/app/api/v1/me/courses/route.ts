import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { ensureStudentEnrollmentsForCohort } from '@/lib/cohort-curriculum';

// GET /api/v1/me/courses — student's enrolled courses with progress
export const GET = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            const { searchParams } = req.nextUrl;
            const page = Math.max(1, Number(searchParams.get('page') || '1'));
            const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '12')));

            const studentProfile = await prisma.studentProfile.findUnique({
                where: { userId: user.id },
                select: {
                    cohortId: true,
                    cohort: {
                        select: {
                            id: true,
                            name: true,
                            program: { select: { id: true, name: true } },
                        },
                    },
                },
            });

            if (studentProfile?.cohortId) {
                // Self-heal enrollments for existing data where cohort syllabus wasn't enrolled.
                await ensureStudentEnrollmentsForCohort(user.id, studentProfile.cohortId);
            }

            const [enrollments, total] = await Promise.all([
                prisma.enrollment.findMany({
                    where: { userId: user.id },
                    include: {
                        course: {
                            include: {
                                creator: { select: { name: true } },
                                program: { select: { id: true, name: true } },
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
                            program: enrollment.course.program,
                            modules: enrollment.course.modules.map((module) => ({
                                id: module.id,
                                title: module.title,
                                lessonCount: module.lessons.length,
                            })),
                        },
                        progress: totalLessons > 0
                            ? Math.round((completed / totalLessons) * 100)
                            : 0,
                        totalLessons,
                        completedLessons: completed,
                        cohort: studentProfile?.cohort
                            ? {
                                id: studentProfile.cohort.id,
                                name: studentProfile.cohort.name,
                                program: studentProfile.cohort.program,
                            }
                            : null,
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
