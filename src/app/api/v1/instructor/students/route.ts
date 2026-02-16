import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/instructor/students - Students in mentor's cohorts
export const GET = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            const { searchParams } = req.nextUrl;
            const search = searchParams.get('search') || '';
            const cohortId = searchParams.get('cohortId') || '';
            const page = Math.max(1, Number(searchParams.get('page') || '1'));
            const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '12')));

            // Get mentor's cohort IDs
            const mentor = await prisma.mentorProfile.findUnique({
                where: { userId: user.id },
                include: { cohorts: { select: { id: true, name: true } } },
            });

            const cohortIds = mentor?.cohorts.map(c => c.id) || [];

            // Build filter
            const where: Record<string, unknown> = {
                cohortId: cohortId && cohortIds.includes(cohortId)
                    ? cohortId
                    : { in: cohortIds },
            };

            if (search) {
                where.user = {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                    ],
                };
            }

            const [students, total] = await Promise.all([
                prisma.studentProfile.findMany({
                    where,
                    include: {
                        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
                        cohort: { select: { id: true, name: true } },
                    },
                    orderBy: { user: { name: 'asc' } },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma.studentProfile.count({ where }),
            ]);

            const flattened = students.map(s => ({
                id: s.id,
                userId: s.userId,
                name: s.user.name,
                email: s.user.email,
                avatarUrl: s.user.avatarUrl,
                phone: s.phone,
                status: s.status,
                cohortId: s.cohortId,
                cohortName: s.cohort?.name,
            }));

            return apiSuccess({
                students: flattened,
                cohorts: mentor?.cohorts || [],
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
