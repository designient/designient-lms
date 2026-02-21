import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/me/quizzes — fetch all quizzes for the student's cohort
export const GET = withAuth(async (req: NextRequest, _ctx, user) => {
    try {
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: user.id },
            select: { cohortId: true },
        });

        if (!studentProfile?.cohortId) {
            return apiSuccess({ quizzes: [] });
        }

        const quizzes = await prisma.quiz.findMany({
            where: {
                cohortId: studentProfile.cohortId,
                isPublished: true,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                cohort: {
                    select: {
                        name: true,
                    },
                },
                _count: {
                    select: { questions: true },
                },
                attempts: {
                    where: {
                        studentId: user.id,
                    },
                    orderBy: {
                        startedAt: 'desc',
                    },
                    take: 1, // Get latest attempt
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Include both attempts and latestAttempt to keep old/new UI contracts working.
        const processedQuizzes = quizzes.map(quiz => ({
            ...quiz,
            latestAttempt: quiz.attempts[0] || null,
        }));

        return apiSuccess({ quizzes: processedQuizzes });
    } catch (error) {
        return handleApiError(error);
    }
});
