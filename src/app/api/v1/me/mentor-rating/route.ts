import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/rbac';
import { apiError, apiSuccess, handleApiError } from '@/lib/errors';

function normalizeFeedback(input: unknown): string | null {
    if (typeof input !== 'string') return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed.slice(0, 1000) : null;
}

export const GET = withAuth(async (_req, _ctx, user) => {
    try {
        if (user.role !== 'STUDENT') {
            return apiError('Only students can access mentor ratings', 403, 'FORBIDDEN');
        }

        const student = await prisma.studentProfile.findUnique({
            where: { userId: user.id },
            include: {
                mentor: {
                    select: {
                        id: true,
                        name: true,
                        mentorProfile: {
                            select: {
                                id: true,
                                rating: true,
                                availabilityStatus: true,
                                _count: { select: { ratings: true } },
                            }
                        },
                    },
                },
            },
        });

        if (!student) {
            return apiError('Student profile not found', 404, 'NOT_FOUND');
        }

        const mentorProfile = student.mentor?.mentorProfile;
        if (!mentorProfile) {
            return apiSuccess({ mentor: null, studentRating: null });
        }

        const existingRating = await prisma.mentorRating.findUnique({
            where: {
                mentorProfileId_studentProfileId: {
                    mentorProfileId: mentorProfile.id,
                    studentProfileId: student.id,
                },
            },
            select: {
                rating: true,
                feedback: true,
                updatedAt: true,
            },
        });

        return apiSuccess({
            mentor: {
                id: student.mentor?.id,
                name: student.mentor?.name,
                profileId: mentorProfile.id,
                rating: mentorProfile.rating,
                totalReviews: mentorProfile._count.ratings,
                availabilityStatus: mentorProfile.availabilityStatus,
            },
            studentRating: existingRating,
        });
    } catch (error) {
        return handleApiError(error);
    }
}, ['STUDENT']);

export const PATCH = withAuth(async (req: NextRequest, _ctx, user) => {
    try {
        if (user.role !== 'STUDENT') {
            return apiError('Only students can rate mentors', 403, 'FORBIDDEN');
        }

        const body = await req.json();
        const rawRating = body?.rating;
        const rating = Number(rawRating);

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return apiError('Rating must be an integer between 1 and 5', 422, 'VALIDATION_ERROR');
        }

        const feedback = normalizeFeedback(body?.feedback);

        const student = await prisma.studentProfile.findUnique({
            where: { userId: user.id },
            include: {
                mentor: {
                    select: {
                        id: true,
                        name: true,
                        mentorProfile: { select: { id: true } },
                    },
                },
            },
        });

        if (!student) {
            return apiError('Student profile not found', 404, 'NOT_FOUND');
        }

        const mentorProfileId = student.mentor?.mentorProfile?.id;
        if (!mentorProfileId) {
            return apiError('No mentor assigned to this student', 400, 'NO_MENTOR_ASSIGNED');
        }

        const result = await prisma.$transaction(async (tx) => {
            await tx.mentorRating.upsert({
                where: {
                    mentorProfileId_studentProfileId: {
                        mentorProfileId,
                        studentProfileId: student.id,
                    },
                },
                create: {
                    mentorProfileId,
                    studentProfileId: student.id,
                    rating,
                    feedback,
                },
                update: {
                    rating,
                    feedback,
                },
            });

            const aggregate = await tx.mentorRating.aggregate({
                where: { mentorProfileId },
                _avg: { rating: true },
                _count: { rating: true },
            });

            const nextRating = aggregate._avg.rating ?? 0;
            const totalReviews = aggregate._count.rating ?? 0;

            const mentor = await tx.mentorProfile.update({
                where: { id: mentorProfileId },
                data: { rating: nextRating },
                include: {
                    user: { select: { id: true, name: true } },
                    _count: { select: { ratings: true } },
                },
            });

            const studentRating = await tx.mentorRating.findUnique({
                where: {
                    mentorProfileId_studentProfileId: {
                        mentorProfileId,
                        studentProfileId: student.id,
                    },
                },
                select: {
                    rating: true,
                    feedback: true,
                    updatedAt: true,
                },
            });

            return {
                mentor: {
                    id: mentor.user.id,
                    name: mentor.user.name,
                    profileId: mentor.id,
                    rating: mentor.rating,
                    totalReviews,
                    availabilityStatus: mentor.availabilityStatus,
                },
                studentRating,
            };
        });

        return apiSuccess(result);
    } catch (error) {
        return handleApiError(error);
    }
}, ['STUDENT']);
