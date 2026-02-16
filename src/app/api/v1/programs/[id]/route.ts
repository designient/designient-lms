import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { programUpdateSchema, formatZodErrors } from '@/lib/validations';
import { logAudit } from '@/lib/audit';

// GET /api/v1/programs/[id] - Get program details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: programId } = await params;
        const program = await prisma.program.findUnique({
            where: { id: programId },
            include: {
                cohorts: {
                    take: 5,
                    orderBy: { startDate: 'desc' }
                },
                _count: { select: { cohorts: true } }
            }
        });

        if (!program) {
            return apiError('Program not found', 404, 'NOT_FOUND');
        }

        return apiSuccess(program);
    } catch (error) {
        return handleApiError(error);
    }
}

// PUT /api/v1/programs/[id] - Update program
export const PUT = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;
            const body = await req.json();
            const parsed = programUpdateSchema.safeParse(body);

            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
            }

            // Check if program exists
            const existing = await prisma.program.findUnique({ where: { id } });
            if (!existing) {
                return apiError('Program not found', 404, 'NOT_FOUND');
            }

            // If name is changed, update slug
            let slug = existing.slug;
            if (parsed.data.name && parsed.data.name !== existing.name) {
                slug = parsed.data.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');

                const slugExists = await prisma.program.findUnique({ where: { slug } });
                if (slugExists && slugExists.id !== id) {
                    return apiError('Program name conflict', 409, 'SLUG_EXISTS');
                }
            }

            const updatedProgram = await prisma.program.update({
                where: { id },
                data: {
                    ...parsed.data,
                    slug,
                },
            });

            await logAudit(user.id, 'PROGRAM_UPDATED', 'Program', id, parsed.data as Record<string, unknown>);

            return apiSuccess(updatedProgram);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN', 'INSTRUCTOR']
);

// DELETE /api/v1/programs/[id] - Delete program
export const DELETE = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;

            // Check if program exists and has no active cohorts
            const program = await prisma.program.findUnique({
                where: { id },
                include: { _count: { select: { cohorts: true } } }
            });

            if (!program) {
                return apiError('Program not found', 404, 'NOT_FOUND');
            }

            if (program._count.cohorts > 0) {
                return apiError('Cannot delete program with existing cohorts. Archive it instead.', 400, 'CONSTRAINT_VIOLATION');
            }

            await prisma.program.delete({ where: { id } });
            await logAudit(user.id, 'PROGRAM_DELETED', 'Program', id);

            return apiSuccess({ message: 'Program deleted successfully' });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
