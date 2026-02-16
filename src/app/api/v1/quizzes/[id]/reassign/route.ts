import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// POST /api/v1/quizzes/[id]/reassign - Grant extra attempt
export const POST = withAuth(
    async (req: NextRequest, ctx) => {
        try {
            const { id } = await ctx.params;
            const { studentId } = await req.json();

            if (!studentId) return apiError('studentId is required', 400);

            const quiz = await prisma.quiz.findUnique({ where: { id } });
            if (!quiz) return apiError('Quiz not found', 404);

            await prisma.quiz.update({
                where: { id },
                data: { maxAttempts: quiz.maxAttempts + 1 },
            });

            return apiSuccess({ message: 'Extra attempt granted', maxAttempts: quiz.maxAttempts + 1 });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
