import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { cohortUpdateSchema, formatZodErrors } from '@/lib/validations';
import { logAudit } from '@/lib/audit';

// GET /api/v1/cohorts/[id] - Get cohort details
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cohort = await prisma.cohort.findUnique({
            where: { id: params.id },
            include: {
                program: { select: { id: true, name: true, slug: true } },
                students: {
                    take: 10,
                    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } }
                },
                mentors: {
                    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } }
                },
                _count: { select: { students: true } }
            }
        });

        if (!cohort) {
            return apiError('Cohort not found', 404, 'NOT_FOUND');
        }

        return apiSuccess(cohort);
    } catch (error) {
        return handleApiError(error);
    }
}

// PUT /api/v1/cohorts/[id] - Update cohort
export const PUT = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const id = ctx.params.id;
            const body = await req.json();
            const parsed = cohortUpdateSchema.safeParse(body);

            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
            }

            const existing = await prisma.cohort.findUnique({ where: { id } });
            if (!existing) {
                return apiError('Cohort not found', 404, 'NOT_FOUND');
            }

            const updatedCohort = await prisma.cohort.update({
                where: { id },
                data: {
                    ...parsed.data,
                    startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
                    endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
                },
            });

            await logAudit(user.id, 'COHORT_UPDATED', 'Cohort', id, JSON.stringify(parsed.data));

            return apiSuccess(updatedCohort);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN', 'INSTRUCTOR', 'PROGRAM_MANAGER']
);

// DELETE /api/v1/cohorts/[id] - Delete cohort
export const DELETE = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const id = ctx.params.id;

            const cohort = await prisma.cohort.findUnique({
                where: { id },
                include: { _count: { select: { students: true } } }
            });

            if (!cohort) {
                return apiError('Cohort not found', 404, 'NOT_FOUND');
            }

            if (cohort._count.students > 0) {
                return apiError('Cannot delete cohort with enrolled students. Archive it instead.', 400, 'CONSTRAINT_VIOLATION');
            }

            await prisma.cohort.delete({ where: { id } });
            await logAudit(user.id, 'COHORT_DELETED', 'Cohort', id);

            return apiSuccess({ message: 'Cohort deleted successfully' });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
