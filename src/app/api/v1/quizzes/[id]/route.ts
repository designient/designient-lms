import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/quizzes/[id] - Quiz detail with questions
export const GET = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;

            const quiz = await prisma.quiz.findUnique({
                where: { id },
                include: {
                    course: { select: { id: true, title: true } },
                    cohort: { select: { id: true, name: true } },
                    questions: {
                        include: {
                            question: true,
                        },
                        orderBy: { position: 'asc' },
                    },
                    attempts: {
                        where: user.role === 'STUDENT' ? { studentId: user.id } : {},
                        orderBy: { startedAt: 'desc' },
                    },
                },
            });

            if (!quiz) return apiError('Quiz not found', 404);

            // For students: hide correct answers
            const formatted = {
                ...quiz,
                questions: quiz.questions.map(qq => ({
                    id: qq.id,
                    position: qq.position,
                    points: qq.points,
                    questionId: qq.questionId,
                    question: qq.question.question,
                    options: qq.question.options,
                    correctIndex: user.role !== 'STUDENT' ? qq.question.correctIndex : undefined,
                    subject: qq.question.subject,
                })),
            };

            return apiSuccess(formatted);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['STUDENT', 'INSTRUCTOR', 'ADMIN']
);

// PUT /api/v1/quizzes/[id] - Update quiz
export const PUT = withAuth(
    async (req: NextRequest, ctx) => {
        try {
            const { id } = await ctx.params;
            const body = await req.json();

            const quiz = await prisma.quiz.update({
                where: { id },
                data: {
                    ...(body.title && { title: body.title }),
                    ...(body.timeLimit !== undefined && { timeLimit: body.timeLimit }),
                    ...(body.maxAttempts !== undefined && { maxAttempts: body.maxAttempts }),
                    ...(body.availableFrom !== undefined && { availableFrom: body.availableFrom ? new Date(body.availableFrom) : null }),
                    ...(body.availableUntil !== undefined && { availableUntil: body.availableUntil ? new Date(body.availableUntil) : null }),
                },
            });

            return apiSuccess(quiz);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);

// DELETE /api/v1/quizzes/[id]
export const DELETE = withAuth(
    async (_req: NextRequest, ctx) => {
        try {
            const { id } = await ctx.params;
            await prisma.quiz.delete({ where: { id } });
            return apiSuccess({ message: 'Quiz deleted' });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
