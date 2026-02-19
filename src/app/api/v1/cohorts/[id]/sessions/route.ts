import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/cohorts/[id]/sessions - List sessions for a cohort
export const GET = withAuth(
    async (req: NextRequest, ctx) => {
        try {
            const { id } = await ctx.params;

            const sessions = await prisma.classSession.findMany({
                where: { cohortId: id },
                include: {
                    course: { select: { id: true, title: true } },
                    _count: { select: { attendances: true } },
                },
                orderBy: { scheduledAt: 'desc' },
            });

            // Get total student count for cohort
            const studentCount = await prisma.studentProfile.count({
                where: { cohortId: id },
            });

            const formatted = sessions.map(s => ({
                id: s.id,
                title: s.title,
                courseTitle: s.course?.title || '',
                courseId: s.courseId,
                scheduledAt: s.scheduledAt,
                duration: s.duration,
                attendanceCount: s._count.attendances,
                studentCount,
            }));

            return apiSuccess({ sessions: formatted, studentCount });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);

// POST /api/v1/cohorts/[id]/sessions - Create a class session
export const POST = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;
            const body = await req.json();
            const { courseId, title, scheduledAt, duration } = body;

            if (!title || !scheduledAt) {
                return apiError('title and scheduledAt are required', 400);
            }

            // Verify mentor has access to this cohort
            const mentor = await prisma.mentorProfile.findUnique({
                where: { userId: user.id },
                include: { cohorts: { select: { id: true } } },
            });

            const hasAccess = user.role === 'ADMIN' || mentor?.cohorts.some(c => c.id === id);
            if (!hasAccess) return apiError('Not authorized for this cohort', 403);

            // Resolve courseId if possible (not required)
            let resolvedCourseId = courseId;
            if (!resolvedCourseId) {
                const cohort = await prisma.cohort.findUnique({
                    where: { id },
                    include: {
                        program: { select: { courseId: true } },
                        courses: { select: { courseId: true }, take: 1 },
                    },
                });
                resolvedCourseId = cohort?.courses[0]?.courseId || cohort?.program?.courseId || null;
            }

            const session = await prisma.classSession.create({
                data: {
                    cohortId: id,
                    ...(resolvedCourseId ? { courseId: resolvedCourseId } : {}),
                    title,
                    scheduledAt: new Date(scheduledAt),
                    duration: duration || 60,
                },
            });

            return apiSuccess(session, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
