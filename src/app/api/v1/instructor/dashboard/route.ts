import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/instructor/dashboard - Instructor dashboard stats
export const GET = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            let cohortIds: string[] = [];
            let mentorCohorts: Array<{ id: string; name: string; status: string; _count: { students: number } }> = [];

            if (user.role === 'ADMIN') {
                const cohorts = await prisma.cohort.findMany({
                    select: { id: true, name: true, status: true, _count: { select: { students: true } } },
                    orderBy: { createdAt: 'desc' },
                });
                cohortIds = cohorts.map(c => c.id);
                mentorCohorts = cohorts;
            } else {
                const mentor = await prisma.mentorProfile.findUnique({
                    where: { userId: user.id },
                    include: {
                        cohorts: {
                            select: { id: true, name: true, status: true, _count: { select: { students: true } } },
                        },
                    },
                });
                cohortIds = mentor?.cohorts.map(c => c.id) || [];
                mentorCohorts = mentor?.cohorts || [];
            }

            // Get counts
            const [totalStudents, pendingSubmissions, totalCourses] = await Promise.all([
                prisma.studentProfile.count({
                    where: { cohortId: { in: cohortIds } },
                }),
                prisma.submission.count({
                    where: {
                        status: { in: ['SUBMITTED', 'RESUBMITTED'] },
                        assignment: {
                            course: {
                                OR: [
                                    { cohortCourses: { some: { cohortId: { in: cohortIds } } } },
                                    { program: { cohorts: { some: { id: { in: cohortIds } } } } },
                                ],
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
                activeCohorts: mentorCohorts.filter(c => c.status === 'ACTIVE').length || 0,
                totalStudents,
                pendingSubmissions,
                totalCourses,
                recentCohorts: mentorCohorts.slice(0, 5),
            });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
