import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/me/submissions
export const GET = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            const { searchParams } = req.nextUrl;
            const page = Math.max(1, Number(searchParams.get('page') || '1'));
            const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')));

            const [submissions, total] = await Promise.all([
                prisma.submission.findMany({
                    where: { studentId: user.id },
                    include: {
                        assignment: { select: { id: true, title: true, maxScore: true, courseId: true } },
                        grade: true,
                    },
                    orderBy: { submittedAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma.submission.count({ where: { studentId: user.id } }),
            ]);

            return apiSuccess({
                submissions,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            });
        } catch (error) {
            return handleApiError(error);
        }
    }
);
