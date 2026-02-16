import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { mentorProfileUpdateSchema, formatZodErrors } from '@/lib/validations';
import { logAudit } from '@/lib/audit';

// GET /api/v1/mentors/[id] - Get mentor details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: mentorId } = await params;
        const mentor = await prisma.mentorProfile.findUnique({
            where: { id: mentorId },
            include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true } },
                cohorts: {
                    select: { id: true, name: true, startDate: true, status: true },
                    orderBy: { startDate: 'desc' }
                }
            }
        });

        if (!mentor) {
            return apiError('Mentor not found', 404, 'NOT_FOUND');
        }

        return apiSuccess({
            ...mentor,
            name: mentor.user.name,
            email: mentor.user.email,
            avatarUrl: mentor.user.avatarUrl,
            joinDate: mentor.user.createdAt,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// PUT /api/v1/mentors/[id] - Update mentor profile
export const PUT = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;
            const body = await req.json();
            const parsed = mentorProfileUpdateSchema.safeParse(body);

            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
            }

            const existing = await prisma.mentorProfile.findUnique({ where: { id } });
            if (!existing) {
                return apiError('Mentor not found', 404, 'NOT_FOUND');
            }

            const updatedMentor = await prisma.mentorProfile.update({
                where: { id },
                data: parsed.data,
            });

            await logAudit(user.id, 'MENTOR_UPDATED', 'MentorProfile', id, parsed.data as Record<string, unknown>);

            return apiSuccess(updatedMentor);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);

// DELETE /api/v1/mentors/[id] - Deactivate/Delete mentor
export const DELETE = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;

            // Soft delete or status update?
            // Usually we mark as INACTIVE or SUSPENDED.
            // If filtering for "Active", we just update status.

            const mentor = await prisma.mentorProfile.findUnique({ where: { id } });
            if (!mentor) {
                return apiError('Mentor not found', 404, 'NOT_FOUND');
            }

            const updatedMentor = await prisma.mentorProfile.update({
                where: { id },
                data: { status: 'INACTIVE' } // Or SUSPENDED
            });

            await logAudit(user.id, 'MENTOR_DEACTIVATED', 'MentorProfile', id);

            return apiSuccess({ message: 'Mentor deactivated successfully' });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
