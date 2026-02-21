import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { isSyllabusApprovalFlowEnabled } from '@/lib/features';
import { getSyllabusBuilderPermissions } from '@/lib/access-control';
import { logAudit } from '@/lib/audit';

export const POST = withAuth(
    async (_req: NextRequest, { params }, user) => {
        try {
            if (!isSyllabusApprovalFlowEnabled()) {
                return apiError('Syllabus approval flow is disabled', 404, 'FEATURE_DISABLED');
            }

            const { id: courseId } = await params;
            const permissions = await getSyllabusBuilderPermissions(user.id, user.role, courseId);

            if (!permissions.canEditDraft || permissions.role !== 'MENTOR') {
                return apiError('Only mentors can withdraw pending drafts', 403, 'FORBIDDEN');
            }

            const draft = await prisma.syllabusDraft.findUnique({
                where: { courseId },
                select: { id: true, status: true },
            });
            if (!draft) {
                return apiError('No draft found', 404, 'NOT_FOUND');
            }
            if (draft.status !== 'PENDING_APPROVAL') {
                return apiError('Only pending drafts can be withdrawn', 409, 'INVALID_STATE');
            }

            const updated = await prisma.syllabusDraft.update({
                where: { courseId },
                data: {
                    status: 'DRAFT',
                    updatedBy: user.id,
                    submittedAt: null,
                    submittedBy: null,
                },
            });

            await logAudit(user.id, 'SYLLABUS_DRAFT_WITHDRAWN', 'Course', courseId, {
                draftId: updated.id,
            });

            return apiSuccess({
                id: updated.id,
                status: updated.status,
                updatedAt: updated.updatedAt,
            });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
