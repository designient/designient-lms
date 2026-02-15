import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { cohortSchema, formatZodErrors } from '@/lib/validations';
import { logAudit } from '@/lib/audit';

// GET /api/v1/cohorts - List all cohorts
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const page = Math.max(1, Number(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '12')));
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status');
        const programId = searchParams.get('programId');

        const where: Record<string, unknown> = {};

        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        if (status) {
            where.status = status;
        }

        if (programId) {
            where.programId = programId;
        }

        const [cohorts, total] = await Promise.all([
            prisma.cohort.findMany({
                where,
                include: {
                    program: { select: { id: true, name: true, slug: true } },
                    _count: { select: { students: true, mentors: true } }
                },
                orderBy: { startDate: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.cohort.count({ where }),
        ]);

        return apiSuccess({
            cohorts,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });

    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/v1/cohorts - Create new cohort
export const POST = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            const body = await req.json();
            const parsed = cohortSchema.safeParse(body);

            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
            }

            // Verify program exists
            const program = await prisma.program.findUnique({
                where: { id: parsed.data.programId }
            });

            if (!program) {
                return apiError('Program not found', 404, 'NOT_FOUND');
            }

            const cohort = await prisma.cohort.create({
                data: {
                    ...parsed.data,
                    // Ensure dates are Date objects if not handled by Zod transformation
                    startDate: new Date(parsed.data.startDate),
                    endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
                },
            });

            await logAudit(user.id, 'COHORT_CREATED', 'Cohort', cohort.id);

            return apiSuccess(cohort, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN', 'INSTRUCTOR', 'PROGRAM_MANAGER']
);
