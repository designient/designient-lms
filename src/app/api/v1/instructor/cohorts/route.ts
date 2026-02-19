import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/instructor/cohorts - List mentor's assigned cohorts
export const GET = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            const mentor = await prisma.mentorProfile.findUnique({
                where: { userId: user.id },
                include: {
                    cohorts: {
                        include: {
                            program: {
                                select: {
                                    id: true,
                                    name: true,
                                    course: { select: { id: true, title: true, slug: true } },
                                },
                            },
                            _count: { select: { students: true } },
                            courses: {
                                include: {
                                    course: { select: { id: true, title: true, slug: true } },
                                },
                            },
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });

            const cohorts = (mentor?.cohorts || []).map(c => {
                // Use CohortCourse list, or fallback to Program's linked course when empty
                const fromCohortCourses = c.courses.map(cc => ({
                    id: cc.course.id,
                    title: cc.course.title,
                    slug: cc.course.slug,
                }));
                const programCourse = c.program?.course;
                const courses =
                    fromCohortCourses.length > 0
                        ? fromCohortCourses
                        : programCourse
                            ? [{ id: programCourse.id, title: programCourse.title, slug: programCourse.slug }]
                            : [];
                return {
                    id: c.id,
                    name: c.name,
                    status: c.status,
                    programName: c.program?.name || '',
                    startDate: c.startDate,
                    endDate: c.endDate,
                    studentCount: c._count.students,
                    capacity: c.capacity,
                    courses,
                };
            });

            return apiSuccess({ cohorts });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
