import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/assignments/[id]/submissions — instructor/admin view
export const GET = withAuth(
    async (req: NextRequest, { params }, user) => {
        try {
            const { id: assignmentId } = await params;
            const { searchParams } = req.nextUrl;
            const page = Math.max(1, Number(searchParams.get('page') || '1'));
            const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')));
            const status = searchParams.get('status');

            const assignment = await prisma.assignment.findUnique({
                where: { id: assignmentId },
                include: { course: true },
            });
            if (!assignment) return apiError('Assignment not found', 404, 'NOT_FOUND');

            if (user.role === 'INSTRUCTOR' && assignment.course.createdBy !== user.id) {
                return apiError('Forbidden', 403, 'FORBIDDEN');
            }

            const where: Record<string, unknown> = { assignmentId };
            if (status) where.status = status;

            const [submissions, total] = await Promise.all([
                prisma.submission.findMany({
                    where,
                    include: {
                        student: { select: { id: true, name: true, email: true } },
                        grade: true,
                    },
                    orderBy: { submittedAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma.submission.count({ where }),
            ]);

            return apiSuccess({
                submissions,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
