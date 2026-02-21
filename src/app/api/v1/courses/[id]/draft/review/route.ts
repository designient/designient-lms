import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { isSyllabusApprovalFlowEnabled } from '@/lib/features';
import { getSyllabusBuilderPermissions } from '@/lib/access-control';
import {
    applySyllabusSnapshotToLive,
    normalizeSyllabusSnapshot,
    snapshotToJson,
} from '@/lib/syllabus';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

const reviewSchema = z.object({
    action: z.enum(['APPROVE', 'REJECT']),
    comment: z.string().trim().max(2000).optional(),
});

function parseDraftSnapshot(snapshot: unknown) {
    try {
        return normalizeSyllabusSnapshot(snapshot);
    } catch {
        return { modules: [] };
    }
}

export const POST = withAuth(
    async (req: NextRequest, { params }, user) => {
        try {
            if (!isSyllabusApprovalFlowEnabled()) {
                return apiError('Syllabus approval flow is disabled', 404, 'FEATURE_DISABLED');
            }

            const { id: courseId } = await params;
            const permissions = await getSyllabusBuilderPermissions(user.id, user.role, courseId);
            if (!permissions.canApprove) {
                return apiError('Only admins can review drafts', 403, 'FORBIDDEN');
            }

            const body = await req.json();
            const parsed = reviewSchema.safeParse(body);
            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR');
            }

            if (parsed.data.action === 'REJECT' && !parsed.data.comment?.trim()) {
                return apiError('Reject comment is required', 422, 'VALIDATION_ERROR');
            }

            const draft = await prisma.syllabusDraft.findUnique({
                where: { courseId },
            });
            if (!draft) {
                return apiError('No draft found for this course', 404, 'NOT_FOUND');
            }
            if (draft.status !== 'PENDING_APPROVAL') {
                return apiError('Only pending drafts can be reviewed', 409, 'INVALID_STATE');
            }

            if (parsed.data.action === 'REJECT') {
                const rejected = await prisma.syllabusDraft.update({
                    where: { courseId },
                    data: {
                        status: 'REJECTED',
                        reviewComment: parsed.data.comment?.trim() || null,
                        reviewedAt: new Date(),
                        reviewedBy: user.id,
                        updatedBy: user.id,
                    },
                    include: {
                        submitter: { select: { id: true, name: true } },
                        reviewer: { select: { id: true, name: true } },
                    },
                });

                await logAudit(user.id, 'SYLLABUS_DRAFT_REJECTED', 'Course', courseId, {
                    draftId: rejected.id,
                    comment: parsed.data.comment,
                });

                return apiSuccess({
                    action: 'REJECT',
                    draft: {
                        id: rejected.id,
                        status: rejected.status,
                        snapshot: parseDraftSnapshot(rejected.snapshot),
                        submittedAt: rejected.submittedAt,
                        submittedBy: rejected.submitter,
                        reviewedAt: rejected.reviewedAt,
                        reviewedBy: rejected.reviewer,
                        reviewComment: rejected.reviewComment,
                        updatedAt: rejected.updatedAt,
                    },
                });
            }

            const approved = await prisma.$transaction(async (tx) => {
                const snapshot = normalizeSyllabusSnapshot(draft.snapshot);
                const liveSnapshot = await applySyllabusSnapshotToLive(tx, courseId, snapshot);

                const updatedDraft = await tx.syllabusDraft.update({
                    where: { courseId },
                    data: {
                        status: 'DRAFT',
                        snapshot: snapshotToJson(liveSnapshot),
                        reviewedAt: new Date(),
                        reviewedBy: user.id,
                        reviewComment: null,
                        submittedAt: null,
                        submittedBy: null,
                        updatedBy: user.id,
                    },
                    include: {
                        submitter: { select: { id: true, name: true } },
                        reviewer: { select: { id: true, name: true } },
                    },
                });

                return { liveSnapshot, updatedDraft };
            });

            await logAudit(user.id, 'SYLLABUS_DRAFT_APPROVED', 'Course', courseId, {
                draftId: approved.updatedDraft.id,
            });

            return apiSuccess({
                action: 'APPROVE',
                liveSnapshot: approved.liveSnapshot,
                draft: {
                    id: approved.updatedDraft.id,
                    status: approved.updatedDraft.status,
                    snapshot: parseDraftSnapshot(approved.updatedDraft.snapshot),
                    submittedAt: approved.updatedDraft.submittedAt,
                    submittedBy: approved.updatedDraft.submitter,
                    reviewedAt: approved.updatedDraft.reviewedAt,
                    reviewedBy: approved.updatedDraft.reviewer,
                    reviewComment: approved.updatedDraft.reviewComment,
                    updatedAt: approved.updatedDraft.updatedAt,
                },
            });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
