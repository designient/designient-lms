import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { isMentorAssignedToCohort } from '@/lib/access-control';

// GET /api/v1/sessions/[id] - Session detail with attendance roster
export const GET = withAuth(
    async (_req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;

            const session = await prisma.classSession.findUnique({
                where: { id },
                include: {
                    course: { select: { id: true, title: true } },
                    cohort: {
                        select: {
                            id: true,
                            name: true,
                            students: {
                                select: {
                                    id: true,
                                    userId: true,
                                    user: { select: { name: true, email: true } },
                                },
                            },
                        },
                    },
                    attendances: {
                        select: {
                            id: true,
                            studentId: true,
                            status: true,
                        },
                    },
                },
            });

            if (!session) return apiError('Session not found', 404);

            if (user.role === 'INSTRUCTOR') {
                const assigned = await isMentorAssignedToCohort(user.id, session.cohort.id);
                if (!assigned) return apiError('Forbidden', 403, 'FORBIDDEN');
            }

            return apiSuccess(session);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);

// PUT /api/v1/sessions/[id] - Update session
export const PUT = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;
            const body = await req.json();

            const existing = await prisma.classSession.findUnique({
                where: { id },
                select: { cohortId: true },
            });
            if (!existing) return apiError('Session not found', 404);

            if (user.role === 'INSTRUCTOR') {
                const assigned = await isMentorAssignedToCohort(user.id, existing.cohortId);
                if (!assigned) return apiError('Forbidden', 403, 'FORBIDDEN');
            }

            const session = await prisma.classSession.update({
                where: { id },
                data: {
                    ...(body.title && { title: body.title }),
                    ...(body.scheduledAt && { scheduledAt: new Date(body.scheduledAt) }),
                    ...(body.duration && { duration: body.duration }),
                },
            });

            return apiSuccess(session);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);

// DELETE /api/v1/sessions/[id]
export const DELETE = withAuth(
    async (_req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;

            const existing = await prisma.classSession.findUnique({
                where: { id },
                select: { cohortId: true },
            });
            if (!existing) return apiError('Session not found', 404);

            if (user.role === 'INSTRUCTOR') {
                const assigned = await isMentorAssignedToCohort(user.id, existing.cohortId);
                if (!assigned) return apiError('Forbidden', 403, 'FORBIDDEN');
            }

            await prisma.classSession.delete({ where: { id } });
            return apiSuccess({ message: 'Session deleted' });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
