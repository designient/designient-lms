import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { logAudit } from '@/lib/audit';

// GET /api/v1/cohorts/[id]/mentors - List mentors assigned to cohort
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: cohortId } = await params;

        const cohort = await prisma.cohort.findUnique({
            where: { id: cohortId },
            include: {
                mentors: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatarUrl: true },
                        },
                    },
                },
            },
        });

        if (!cohort) {
            return apiError('Cohort not found', 404, 'NOT_FOUND');
        }

        const mentors = cohort.mentors.map(m => ({
            id: m.id,
            userId: m.userId,
            name: m.user.name,
            email: m.user.email,
            avatarUrl: m.user.avatarUrl,
            specialization: m.specialization,
            status: m.status,
        }));

        return apiSuccess({ mentors });
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/v1/cohorts/[id]/mentors - Assign mentor to cohort
export const POST = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id: cohortId } = await ctx.params;
            const body = await req.json();
            const { mentorId } = body;

            if (!mentorId) {
                return apiError('mentorId is required', 400, 'MISSING_FIELD');
            }

            // Verify cohort and mentor exist
            const [cohort, mentor] = await Promise.all([
                prisma.cohort.findUnique({ where: { id: cohortId } }),
                prisma.mentorProfile.findUnique({
                    where: { id: mentorId },
                    include: { cohorts: { select: { id: true } } },
                }),
            ]);

            if (!cohort) return apiError('Cohort not found', 404, 'NOT_FOUND');
            if (!mentor) return apiError('Mentor not found', 404, 'NOT_FOUND');

            // Check if already assigned
            const alreadyAssigned = mentor.cohorts.some(c => c.id === cohortId);
            if (alreadyAssigned) {
                return apiError('Mentor is already assigned to this cohort', 409, 'ALREADY_EXISTS');
            }

            // Check max cohorts limit
            if (mentor.cohorts.length >= mentor.maxCohorts) {
                return apiError(
                    `Mentor has reached their maximum cohort limit (${mentor.maxCohorts})`,
                    400,
                    'LIMIT_EXCEEDED'
                );
            }

            // Connect mentor to cohort
            await prisma.cohort.update({
                where: { id: cohortId },
                data: {
                    mentors: { connect: { id: mentorId } },
                },
            });

            await logAudit(user.id, 'MENTOR_ASSIGNED_TO_COHORT', 'Cohort', cohortId, {
                mentorId,
            } as Record<string, unknown>);

            return apiSuccess({ message: 'Mentor assigned to cohort' }, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);

// DELETE /api/v1/cohorts/[id]/mentors - Remove mentor from cohort
export const DELETE = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id: cohortId } = await ctx.params;
            const body = await req.json();
            const { mentorId } = body;

            if (!mentorId) {
                return apiError('mentorId is required', 400, 'MISSING_FIELD');
            }

            const cohort = await prisma.cohort.findUnique({
                where: { id: cohortId },
                include: { mentors: { select: { id: true } } },
            });

            if (!cohort) return apiError('Cohort not found', 404, 'NOT_FOUND');

            const isAssigned = cohort.mentors.some(m => m.id === mentorId);
            if (!isAssigned) {
                return apiError('Mentor is not assigned to this cohort', 404, 'NOT_FOUND');
            }

            await prisma.cohort.update({
                where: { id: cohortId },
                data: {
                    mentors: { disconnect: { id: mentorId } },
                },
            });

            await logAudit(user.id, 'MENTOR_REMOVED_FROM_COHORT', 'Cohort', cohortId, {
                mentorId,
            } as Record<string, unknown>);

            return apiSuccess({ message: 'Mentor removed from cohort' });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
