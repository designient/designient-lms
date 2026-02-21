import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
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
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        createdAt: true,
                        updatedAt: true,
                        _count: { select: { studentsMentored: true } },
                    }
                },
                cohorts: {
                    select: { id: true, name: true, startDate: true, status: true },
                    orderBy: { startDate: 'desc' }
                },
                _count: { select: { ratings: true } },
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
            lastActive: mentor.user.updatedAt,
            totalReviews: mentor._count.ratings,
            totalStudentsMentored: mentor.user._count.studentsMentored,
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

            const { cohortIds, ...updateData } = parsed.data;
            const bodyName = typeof body.name === 'string' ? body.name.trim() : undefined;
            const bodyEmail = typeof body.email === 'string' ? body.email.trim() : undefined;
            const bodyAvatarUrl = body.avatarUrl;

            if (bodyEmail) {
                const existingEmail = await prisma.user.findFirst({
                    where: {
                        email: bodyEmail,
                        id: { not: existing.userId },
                    },
                    select: { id: true },
                });
                if (existingEmail) {
                    return apiError('Email already in use', 409, 'EMAIL_EXISTS');
                }
            }

            const userUpdate: Record<string, unknown> = {};
            if (bodyName) userUpdate.name = bodyName;
            if (bodyEmail) userUpdate.email = bodyEmail;
            if (bodyAvatarUrl !== undefined) {
                if (bodyAvatarUrl === null || bodyAvatarUrl === '') {
                    userUpdate.avatarUrl = null;
                } else if (typeof bodyAvatarUrl === 'string') {
                    userUpdate.avatarUrl = bodyAvatarUrl;
                } else {
                    return apiError('Invalid avatarUrl', 422, 'VALIDATION_ERROR');
                }
            }

            if (Object.keys(userUpdate).length > 0) {
                await prisma.user.update({
                    where: { id: existing.userId },
                    data: userUpdate,
                });
            }

            const updatedMentor = await prisma.mentorProfile.update({
                where: { id },
                data: {
                    ...updateData,
                    cohorts: cohortIds ? {
                        set: cohortIds.map((cid) => ({ id: cid })),
                    } : undefined,
                },
                include: {
                    cohorts: { select: { id: true, name: true, status: true } },
                }
            });

            await logAudit(user.id, 'MENTOR_UPDATED', 'MentorProfile', id, parsed.data as Record<string, unknown>);

            return apiSuccess(updatedMentor);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);

// DELETE /api/v1/mentors/[id] - Permanently delete mentor
export const DELETE = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;

            const mentor = await prisma.mentorProfile.findUnique({
                where: { id },
                select: { userId: true }
            });

            if (!mentor) {
                return apiError('Mentor not found', 404, 'NOT_FOUND');
            }

            try {
                // Attempt hard delete of User (cascades to MentorProfile)
                await prisma.user.delete({
                    where: { id: mentor.userId }
                });

                await logAudit(user.id, 'MENTOR_DELETED', 'User', mentor.userId);

                return apiSuccess({ message: 'Mentor permanently deleted' });
            } catch (err: unknown) {
                // Check for Foreign Key constraint violation (P2003)
                if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
                    return apiError(
                        'Cannot delete mentor because they have associated content (Courses, Assignments, etc.). Please reassign or delete these resources first.',
                        409,
                        'CONSTRAINT_VIOLATION'
                    );
                }
                throw err;
            }
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
