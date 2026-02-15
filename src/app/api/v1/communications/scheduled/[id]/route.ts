import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { logAudit } from '@/lib/audit';

// DELETE /api/v1/communications/scheduled/[id] - Cancel scheduled message
export const DELETE = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const id = ctx.params.id;

            const message = await prisma.message.findUnique({ where: { id } });
            if (!message) {
                return apiError('Message not found', 404, 'NOT_FOUND');
            }

            if (message.status !== 'SCHEDULED') {
                return apiError('Cannot cancel a message that is not scheduled', 400, 'CONSTRAINT_VIOLATION');
            }

            // We can delete it or mark as CANCELLED
            // Let's mark as CANCELLED to keep history
            const updatedMessage = await prisma.message.update({
                where: { id },
                data: { status: 'CANCELLED' }
            });

            await logAudit(user.id, 'MESSAGE_CANCELLED', 'Message', id);

            return apiSuccess(updatedMessage);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN', 'INSTRUCTOR', 'PROGRAM_MANAGER']
);
