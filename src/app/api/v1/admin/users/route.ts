import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/admin/users
export const GET = withAuth(
    async (req: NextRequest) => {
        try {
            const { searchParams } = req.nextUrl;
            const page = Math.max(1, Number(searchParams.get('page') || '1'));
            const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')));
            const search = searchParams.get('search') || '';
            const role = searchParams.get('role');

            const where: Record<string, unknown> = {};
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ];
            }
            if (role) where.role = role;

            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        isActive: true,
                        emailVerified: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma.user.count({ where }),
            ]);

            return apiSuccess({
                users,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
