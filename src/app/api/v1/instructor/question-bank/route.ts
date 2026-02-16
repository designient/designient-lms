import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/instructor/question-bank - List mentor's questions
export const GET = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            const { searchParams } = req.nextUrl;
            const search = searchParams.get('search') || '';
            const subject = searchParams.get('subject') || '';
            const page = Number(searchParams.get('page') || 1);
            const limit = Number(searchParams.get('limit') || 20);

            const where: Record<string, unknown> = { createdBy: user.id };
            if (search) where.question = { contains: search, mode: 'insensitive' };
            if (subject) where.subject = subject;

            const [questions, total] = await Promise.all([
                prisma.questionBank.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma.questionBank.count({ where }),
            ]);

            return apiSuccess({ questions, total, page, totalPages: Math.ceil(total / limit) });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);

// POST /api/v1/instructor/question-bank - Create question
export const POST = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            const { question, options, correctIndex, subject } = await req.json();

            if (!question || !Array.isArray(options) || options.length < 2 || correctIndex === undefined) {
                return apiError('question, options (array), and correctIndex are required', 400);
            }

            const q = await prisma.questionBank.create({
                data: {
                    createdBy: user.id,
                    question,
                    options,
                    correctIndex,
                    subject: subject || 'General',
                },
            });

            return apiSuccess(q, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);

// PUT /api/v1/instructor/question-bank - Edit question
export const PUT = withAuth(
    async (req: NextRequest) => {
        try {
            const { id, question, options, correctIndex, subject } = await req.json();
            if (!id) return apiError('id is required', 400);

            const q = await prisma.questionBank.update({
                where: { id },
                data: {
                    ...(question && { question }),
                    ...(options && { options }),
                    ...(correctIndex !== undefined && { correctIndex }),
                    ...(subject && { subject }),
                },
            });

            return apiSuccess(q);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);

// DELETE /api/v1/instructor/question-bank
export const DELETE = withAuth(
    async (req: NextRequest) => {
        try {
            const { id } = await req.json();
            if (!id) return apiError('id is required', 400);
            await prisma.questionBank.delete({ where: { id } });
            return apiSuccess({ message: 'Deleted' });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
