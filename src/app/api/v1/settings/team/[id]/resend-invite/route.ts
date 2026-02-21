import { randomBytes } from 'crypto';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { logAudit } from '@/lib/audit';
import { sendInvitationEmail } from '@/lib/email';

// POST /api/v1/settings/team/[id]/resend-invite - resend invite for pending team member
export const POST = withAuth(
    async (_req, ctx, user) => {
        try {
            const { id } = await ctx.params;
            if (!id) return apiError('Team member id is required', 400, 'VALIDATION_ERROR');

            const target = await prisma.user.findUnique({
                where: { id },
                select: { id: true, name: true, email: true, role: true, passwordHash: true, isActive: true },
            });

            if (!target || !['ADMIN', 'INSTRUCTOR'].includes(target.role)) {
                return apiError('Team member not found', 404, 'NOT_FOUND');
            }

            if (!target.isActive) {
                return apiError('Cannot resend invite for deactivated member', 409, 'INVALID_STATE');
            }

            if (target.passwordHash !== 'PENDING_SETUP') {
                return apiError('Invite can only be resent for pending accounts', 409, 'INVALID_STATE');
            }

            const token = randomBytes(32).toString('hex');
            const tokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000);

            await prisma.user.update({
                where: { id: target.id },
                data: {
                    resetToken: token,
                    resetTokenExp: tokenExp,
                },
            });

            sendInvitationEmail(
                target.email,
                token,
                target.role === 'ADMIN' ? 'admin' : 'mentor',
                target.name
            ).catch((err: unknown) => console.error('Failed to resend team invitation email:', err));

            await logAudit(user.id, 'TEAM_MEMBER_INVITE_RESENT', 'User', target.id);

            return apiSuccess({ message: 'Invitation resent successfully' });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
