import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/courses/[id]/quizzes - List quizzes for a course
export const GET = withAuth(
    async (req: NextRequest, ctx) => {
        try {
            const { id } = await ctx.params;
            const cohortId = req.nextUrl.searchParams.get('cohortId') || undefined;

            const where: Record<string, unknown> = { courseId: id };
            if (cohortId) where.cohortId = cohortId;

            const quizzes = await prisma.quiz.findMany({
                where,
                include: {
                    _count: { select: { questions: true, attempts: true } },
                    cohort: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
            });

            return apiSuccess({ quizzes });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['STUDENT', 'INSTRUCTOR', 'ADMIN']
);

// POST /api/v1/courses/[id]/quizzes - Create quiz
export const POST = withAuth(
    async (req: NextRequest, ctx) => {
        try {
            const { id } = await ctx.params;
            const { title, cohortId, timeLimit, maxAttempts, availableFrom, availableUntil } = await req.json();

            if (!title || !cohortId) {
                return apiError('title and cohortId are required', 400);
            }

            const quiz = await prisma.quiz.create({
                data: {
                    courseId: id,
                    cohortId,
                    title,
                    timeLimit: timeLimit || null,
                    maxAttempts: maxAttempts || 1,
                    availableFrom: availableFrom ? new Date(availableFrom) : null,
                    availableUntil: availableUntil ? new Date(availableUntil) : null,
                },
            });

            return apiSuccess(quiz, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
