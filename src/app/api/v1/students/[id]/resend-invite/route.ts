import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { logAudit } from '@/lib/audit';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email';

// POST /api/v1/students/[id]/resend-invite — resend invitation email
export const POST = withAuth(
    async (req: NextRequest, { params }, user) => {
        try {
            const { id: studentId } = await params;

            const student = await prisma.studentProfile.findUnique({
                where: { id: studentId },
                include: { user: true },
            });
            if (!student) return apiError('Student not found', 404, 'NOT_FOUND');

            // Only resend if the user hasn't set up their account yet
            if (student.user.passwordHash !== 'PENDING_SETUP') {
                return apiError(
                    'Student has already set up their account.',
                    400,
                    'ALREADY_SETUP'
                );
            }

            // Generate a new token
            const token = crypto.randomBytes(32).toString('hex');
            const tokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            await prisma.user.update({
                where: { id: student.userId },
                data: {
                    resetToken: token,
                    resetTokenExp: tokenExp,
                },
            });

            // Send invitation email
            await sendInvitationEmail(
                student.user.email,
                token,
                'student',
                student.user.name
            );

            await logAudit(user.id, 'INVITE_RESENT', 'StudentProfile', studentId, {
                email: student.user.email,
            });

            return apiSuccess({ message: 'Invitation email has been resent.' });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
