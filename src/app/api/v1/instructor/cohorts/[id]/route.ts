import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/instructor/cohorts/[id] - Get cohort detail for mentor
export const GET = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id: cohortId } = await ctx.params;

            // Verify mentor is assigned to this cohort
            const mentor = await prisma.mentorProfile.findUnique({
                where: { userId: user.id },
                include: { cohorts: { select: { id: true } } },
            });

            const isAssigned = mentor?.cohorts.some(c => c.id === cohortId);
            if (!isAssigned && user.role !== 'ADMIN') {
                return apiError('Not assigned to this cohort', 403, 'FORBIDDEN');
            }

            const cohort = await prisma.cohort.findUnique({
                where: { id: cohortId },
                include: {
                    program: { select: { id: true, name: true } },
                    students: {
                        include: {
                            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
                        },
                        orderBy: { user: { name: 'asc' } },
                    },
                    courses: {
                        include: {
                            course: {
                                select: {
                                    id: true,
                                    title: true,
                                    slug: true,
                                    level: true,
                                    _count: { select: { modules: true } },
                                },
                            },
                        },
                    },
                    _count: { select: { students: true } },
                },
            });

            if (!cohort) {
                return apiError('Cohort not found', 404, 'NOT_FOUND');
            }

            return apiSuccess({
                id: cohort.id,
                name: cohort.name,
                status: cohort.status,
                programName: cohort.program?.name || '',
                startDate: cohort.startDate,
                endDate: cohort.endDate,
                capacity: cohort.capacity,
                studentCount: cohort._count.students,
                students: cohort.students.map(s => ({
                    id: s.id,
                    userId: s.userId,
                    name: s.user.name,
                    email: s.user.email,
                    avatarUrl: s.user.avatarUrl,
                    status: s.status,
                    phone: s.phone,
                })),
                courses: cohort.courses.map(cc => ({
                    id: cc.course.id,
                    title: cc.course.title,
                    slug: cc.course.slug,
                    level: cc.course.level,
                    moduleCount: cc.course._count.modules,
                })),
            });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
