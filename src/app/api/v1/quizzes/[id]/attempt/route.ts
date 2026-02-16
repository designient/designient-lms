import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// POST /api/v1/quizzes/[id]/attempt - Start or submit quiz attempt
export const POST = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;
            const body = await req.json();

            const quiz = await prisma.quiz.findUnique({
                where: { id },
                include: { questions: { include: { question: true } } },
            });

            if (!quiz) return apiError('Quiz not found', 404);

            // Check availability window
            const now = new Date();
            if (quiz.availableFrom && now < quiz.availableFrom) {
                return apiError('Quiz is not yet available', 400);
            }
            if (quiz.availableUntil && now > quiz.availableUntil) {
                return apiError('Quiz is no longer available', 400);
            }

            // If answers provided → submit attempt
            if (body.answers && body.attemptId) {
                const attempt = await prisma.quizAttempt.findUnique({ where: { id: body.attemptId } });
                if (!attempt || attempt.studentId !== user.id) return apiError('Not authorized', 403);
                if (attempt.submittedAt) return apiError('Already submitted', 400);

                // Auto-grade
                let score = 0;
                const answers = body.answers as Array<{ questionId: string; selectedIndex: number }>;
                const answerOps = answers.map(a => {
                    const qq = quiz.questions.find(q => q.questionId === a.questionId);
                    const isCorrect = qq ? qq.question.correctIndex === a.selectedIndex : false;
                    if (isCorrect && qq) score += qq.points;
                    return prisma.quizAnswer.create({
                        data: {
                            attemptId: body.attemptId,
                            questionId: a.questionId,
                            selectedIndex: a.selectedIndex,
                            isCorrect,
                        },
                    });
                });

                await prisma.$transaction([
                    ...answerOps,
                    prisma.quizAttempt.update({
                        where: { id: body.attemptId },
                        data: { submittedAt: now, score },
                    }),
                ]);

                // Return results with correct answers
                const results = answers.map(a => {
                    const qq = quiz.questions.find(q => q.questionId === a.questionId);
                    return {
                        questionId: a.questionId,
                        selectedIndex: a.selectedIndex,
                        correctIndex: qq?.question.correctIndex,
                        isCorrect: qq ? qq.question.correctIndex === a.selectedIndex : false,
                        points: qq?.points || 0,
                    };
                });

                const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

                return apiSuccess({ score, totalPoints, results, submitted: true });
            }

            // Start new attempt
            const existingAttempts = await prisma.quizAttempt.count({
                where: { quizId: id, studentId: user.id },
            });

            if (existingAttempts >= quiz.maxAttempts) {
                return apiError('Maximum attempts reached', 400);
            }

            const attempt = await prisma.quizAttempt.create({
                data: {
                    quizId: id,
                    studentId: user.id,
                    attemptNo: existingAttempts + 1,
                },
            });

            return apiSuccess(attempt, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['STUDENT']
);
