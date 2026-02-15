import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/me/grades
export const GET = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            const { searchParams } = req.nextUrl;
            const page = Math.max(1, Number(searchParams.get('page') || '1'));
            const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')));

            const [grades, total] = await Promise.all([
                prisma.grade.findMany({
                    where: { submission: { studentId: user.id } },
                    include: {
                        submission: {
                            include: {
                                assignment: {
                                    select: { id: true, title: true, maxScore: true, courseId: true },
                                },
                            },
                        },
                        grader: { select: { name: true } },
                    },
                    orderBy: { gradedAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma.grade.count({ where: { submission: { studentId: user.id } } }),
            ]);

            return apiSuccess({
                grades,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            });
        } catch (error) {
            return handleApiError(error);
        }
    }
);
