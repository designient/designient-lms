import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

const inviteTeamSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    role: z.enum(['ADMIN', 'INSTRUCTOR']),
});

// GET /api/v1/settings/team - List team members
export async function GET() {
    try {
        const team = await prisma.user.findMany({
            where: { role: { in: ['ADMIN', 'INSTRUCTOR'] } },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                createdAt: true,
            },
            orderBy: { name: 'asc' }
        });
        return apiSuccess({ team });
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/v1/settings/team - Invite team member
export const POST = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            const body = await req.json();
            const parsed = inviteTeamSchema.safeParse(body);

            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', parsed.error);
            }

            const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
            if (existingUser) {
                return apiError('User already exists', 409, 'USER_EXISTS');
            }

            const newUser = await prisma.user.create({
                data: {
                    email: parsed.data.email,
                    name: parsed.data.name,
                    role: parsed.data.role,
                    passwordHash: 'pending_invite', // Should generate token really
                }
            });

            await logAudit(user.id, 'TEAM_MEMBER_INVITED', 'User', newUser.id);

            return apiSuccess(newUser, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
