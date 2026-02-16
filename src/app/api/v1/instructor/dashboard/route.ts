import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/instructor/dashboard - Instructor dashboard stats
export const GET = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            // Get mentor profile
            const mentor = await prisma.mentorProfile.findUnique({
                where: { userId: user.id },
                include: {
                    cohorts: {
                        select: { id: true, name: true, status: true, _count: { select: { students: true } } },
                    },
                },
            });

            const cohortIds = mentor?.cohorts.map(c => c.id) || [];

            // Get counts
            const [totalStudents, pendingSubmissions, totalCourses] = await Promise.all([
                prisma.studentProfile.count({
                    where: { cohortId: { in: cohortIds } },
                }),
                prisma.submission.count({
                    where: {
                        status: 'SUBMITTED',
                        assignment: {
                            module: {
                                course: {
                                    cohortCourses: { some: { cohortId: { in: cohortIds } } },
                                },
                            },
                        },
                    },
                }),
                prisma.cohortCourse.count({
                    where: { cohortId: { in: cohortIds } },
                }),
            ]);

            return apiSuccess({
                totalCohorts: cohortIds.length,
                activeCohorts: mentor?.cohorts.filter(c => c.status === 'ACTIVE').length || 0,
                totalStudents,
                pendingSubmissions,
                totalCourses,
                recentCohorts: mentor?.cohorts.slice(0, 5) || [],
            });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
