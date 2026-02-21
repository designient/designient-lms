import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { isSyllabusApprovalFlowEnabled } from '@/lib/features';
import { getSyllabusBuilderPermissions } from '@/lib/access-control';
import { normalizeSyllabusSnapshot, snapshotToJson } from '@/lib/syllabus';
import { logAudit } from '@/lib/audit';

function parseDraftSnapshot(snapshot: unknown) {
    try {
        return normalizeSyllabusSnapshot(snapshot);
    } catch {
        return { modules: [] };
    }
}

export const PUT = withAuth(
    async (req: NextRequest, { params }, user) => {
        try {
            if (!isSyllabusApprovalFlowEnabled()) {
                return apiError('Syllabus approval flow is disabled', 404, 'FEATURE_DISABLED');
            }

            const { id: courseId } = await params;
            const permissions = await getSyllabusBuilderPermissions(user.id, user.role, courseId);
            if (!permissions.canEditDraft) {
                return apiError('You cannot edit draft syllabus for this course', 403, 'FORBIDDEN');
            }

            const body = await req.json();
            const snapshot = normalizeSyllabusSnapshot(body?.snapshot);

            const existing = await prisma.syllabusDraft.findUnique({
                where: { courseId },
                select: { id: true, status: true },
            });

            if (existing?.status === 'PENDING_APPROVAL') {
                return apiError('Draft is pending approval. Withdraw before editing.', 409, 'DRAFT_PENDING');
            }

            const draft = await prisma.syllabusDraft.upsert({
                where: { courseId },
                create: {
                    courseId,
                    snapshot: snapshotToJson(snapshot),
                    status: 'DRAFT',
                    createdBy: user.id,
                    updatedBy: user.id,
                },
                update: {
                    snapshot: snapshotToJson(snapshot),
                    updatedBy: user.id,
                },
                include: {
                    submitter: { select: { id: true, name: true } },
                    reviewer: { select: { id: true, name: true } },
                },
            });

            await logAudit(user.id, 'SYLLABUS_DRAFT_SAVED', 'Course', courseId, {
                draftId: draft.id,
                status: draft.status,
            });

            return apiSuccess({
                id: draft.id,
                status: draft.status,
                snapshot: parseDraftSnapshot(draft.snapshot),
                submittedAt: draft.submittedAt,
                submittedBy: draft.submitter,
                reviewedAt: draft.reviewedAt,
                reviewedBy: draft.reviewer,
                reviewComment: draft.reviewComment,
                updatedAt: draft.updatedAt,
            });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
