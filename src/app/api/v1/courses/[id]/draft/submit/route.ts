import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { isSyllabusApprovalFlowEnabled } from '@/lib/features';
import { getSyllabusBuilderPermissions } from '@/lib/access-control';
import { snapshotToJson, validateSyllabusSnapshotForSubmit } from '@/lib/syllabus';
import { logAudit } from '@/lib/audit';

export const POST = withAuth(
    async (_req: NextRequest, { params }, user) => {
        try {
            if (!isSyllabusApprovalFlowEnabled()) {
                return apiError('Syllabus approval flow is disabled', 404, 'FEATURE_DISABLED');
            }

            const { id: courseId } = await params;
            const permissions = await getSyllabusBuilderPermissions(user.id, user.role, courseId);
            if (!permissions.canEditDraft) {
                return apiError('You cannot submit draft syllabus for this course', 403, 'FORBIDDEN');
            }

            const draft = await prisma.syllabusDraft.findUnique({
                where: { courseId },
            });

            if (!draft) {
                return apiError('No draft found. Save draft before submitting.', 400, 'NO_DRAFT');
            }

            if (draft.status === 'PENDING_APPROVAL') {
                return apiError('Draft is already pending approval', 409, 'DRAFT_PENDING');
            }

            const validatedSnapshot = validateSyllabusSnapshotForSubmit(draft.snapshot);

            const updated = await prisma.syllabusDraft.update({
                where: { courseId },
                data: {
                    snapshot: snapshotToJson(validatedSnapshot),
                    status: 'PENDING_APPROVAL',
                    submittedBy: user.id,
                    submittedAt: new Date(),
                    updatedBy: user.id,
                },
                include: {
                    submitter: { select: { id: true, name: true } },
                },
            });

            await logAudit(user.id, 'SYLLABUS_DRAFT_SUBMITTED', 'Course', courseId, {
                draftId: updated.id,
            });

            return apiSuccess({
                id: updated.id,
                status: updated.status,
                submittedAt: updated.submittedAt,
                submittedBy: updated.submitter,
                updatedAt: updated.updatedAt,
            });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
