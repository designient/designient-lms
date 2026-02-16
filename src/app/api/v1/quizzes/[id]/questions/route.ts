import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// POST /api/v1/quizzes/[id]/questions - Add question to quiz
export const POST = withAuth(
    async (req: NextRequest, ctx) => {
        try {
            const { id } = await ctx.params;
            const { questionId, position, points } = await req.json();

            if (!questionId) return apiError('questionId is required', 400);

            const count = await prisma.quizQuestion.count({ where: { quizId: id } });

            const qq = await prisma.quizQuestion.create({
                data: {
                    quizId: id,
                    questionId,
                    position: position ?? count,
                    points: points || 1,
                },
            });

            return apiSuccess(qq, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);

// DELETE /api/v1/quizzes/[id]/questions - Remove question from quiz
export const DELETE = withAuth(
    async (req: NextRequest) => {
        try {
            const { quizQuestionId } = await req.json();
            if (!quizQuestionId) return apiError('quizQuestionId is required', 400);

            await prisma.quizQuestion.delete({ where: { id: quizQuestionId } });
            return apiSuccess({ message: 'Question removed' });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
