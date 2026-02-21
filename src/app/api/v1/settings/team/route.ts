import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { sendInvitationEmail } from '@/lib/email';

const inviteTeamSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    role: z.enum(['ADMIN', 'INSTRUCTOR']),
});

// GET /api/v1/settings/team - List team members
export const GET = withAuth(
    async () => {
        try {
            const now = new Date();
            const team = await prisma.user.findMany({
                where: { role: { in: ['ADMIN', 'INSTRUCTOR'] } },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    avatarUrl: true,
                    isActive: true,
                    passwordHash: true,
                    resetToken: true,
                    resetTokenExp: true,
                    createdAt: true,
                },
                orderBy: { name: 'asc' }
            });

            const mapped = team.map((member) => ({
                id: member.id,
                name: member.name,
                email: member.email,
                role: member.role,
                avatarUrl: member.avatarUrl,
                isActive: member.isActive,
                status: !member.isActive
                    ? 'DEACTIVATED'
                    : member.passwordHash === 'PENDING_SETUP' || (member.resetToken && member.resetTokenExp && member.resetTokenExp > now)
                        ? 'INVITED'
                        : 'ACTIVE',
                createdAt: member.createdAt,
            }));

            return apiSuccess({ team: mapped });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);

// POST /api/v1/settings/team - Invite team member
export const POST = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            const body = await req.json();
            const parsed = inviteTeamSchema.safeParse(body);

            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', parsed.error);
            }

            const email = parsed.data.email.trim().toLowerCase();
            const existingUser = await prisma.user.findFirst({
                where: { email: { equals: email, mode: 'insensitive' } },
            });
            if (existingUser) {
                return apiError('User already exists', 409, 'USER_EXISTS');
            }

            const token = randomBytes(32).toString('hex');
            const tokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const newUser = await prisma.user.create({
                data: {
                    email,
                    name: parsed.data.name,
                    role: parsed.data.role,
                    passwordHash: 'PENDING_SETUP',
                    isActive: true,
                    emailVerified: false,
                    resetToken: token,
                    resetTokenExp: tokenExp,
                }
            });

            sendInvitationEmail(
                newUser.email,
                token,
                newUser.role === 'ADMIN' ? 'admin' : 'mentor',
                newUser.name
            ).catch((err: unknown) => console.error('Failed to send team invitation email:', err));

            await logAudit(user.id, 'TEAM_MEMBER_INVITED', 'User', newUser.id);

            return apiSuccess({
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                avatarUrl: newUser.avatarUrl,
                isActive: newUser.isActive,
                status: 'INVITED',
                createdAt: newUser.createdAt,
            }, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
