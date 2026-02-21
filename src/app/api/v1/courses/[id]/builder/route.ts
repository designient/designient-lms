import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { isSyllabusApprovalFlowEnabled } from '@/lib/features';
import { getSyllabusBuilderPermissions } from '@/lib/access-control';
import {
    applySyllabusSnapshotToLive,
    computeSyllabusDiff,
    getLiveSyllabusSnapshot,
    normalizeSyllabusSnapshot,
    snapshotToJson,
    validateSyllabusSnapshotForSubmit,
} from '@/lib/syllabus';
import { logAudit } from '@/lib/audit';

function parseDraftSnapshot(snapshot: unknown) {
    try {
        return normalizeSyllabusSnapshot(snapshot);
    } catch {
        return { modules: [] };
    }
}

export const GET = withAuth(
    async (_req: NextRequest, { params }, user) => {
        try {
            if (!isSyllabusApprovalFlowEnabled()) {
                return apiError('Syllabus approval flow is disabled', 404, 'FEATURE_DISABLED');
            }

            const { id: courseId } = await params;

            const course = await prisma.course.findUnique({
                where: { id: courseId },
                select: {
                    id: true,
                    title: true,
                    isPublished: true,
                    program: {
                        select: {
                            id: true,
                            name: true,
                            status: true,
                        },
                    },
                },
            });

            if (!course) {
                return apiError('Course not found', 404, 'NOT_FOUND');
            }

            const permissions = await getSyllabusBuilderPermissions(user.id, user.role, courseId);
            if (!permissions.canAccess) {
                return apiError(permissions.reason || 'Forbidden', 403, 'FORBIDDEN');
            }

            const [liveSnapshot, draftRecord] = await Promise.all([
                getLiveSyllabusSnapshot(courseId),
                prisma.syllabusDraft.findUnique({
                    where: { courseId },
                    include: {
                        submitter: { select: { id: true, name: true } },
                        reviewer: { select: { id: true, name: true } },
                    },
                }),
            ]);

            const draftSnapshot = draftRecord ? parseDraftSnapshot(draftRecord.snapshot) : null;
            const diff = draftSnapshot ? computeSyllabusDiff(liveSnapshot, draftSnapshot) : null;

            return apiSuccess({
                featureEnabled: true,
                course,
                liveSnapshot,
                draft: draftRecord
                    ? {
                        id: draftRecord.id,
                        status: draftRecord.status,
                        snapshot: draftSnapshot,
                        submittedAt: draftRecord.submittedAt,
                        submittedBy: draftRecord.submitter,
                        reviewedAt: draftRecord.reviewedAt,
                        reviewedBy: draftRecord.reviewer,
                        reviewComment: draftRecord.reviewComment,
                        updatedAt: draftRecord.updatedAt,
                    }
                    : null,
                permissions,
                diff,
            });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);

export const PUT = withAuth(
    async (req: NextRequest, { params }, user) => {
        try {
            if (!isSyllabusApprovalFlowEnabled()) {
                return apiError('Syllabus approval flow is disabled', 404, 'FEATURE_DISABLED');
            }

            const { id: courseId } = await params;
            const permissions = await getSyllabusBuilderPermissions(user.id, user.role, courseId);

            if (!permissions.canEditLive) {
                return apiError('Live syllabus edits are restricted to admins', 403, 'FORBIDDEN');
            }

            const pendingDraft = await prisma.syllabusDraft.findUnique({
                where: { courseId },
                select: { id: true, status: true },
            });
            if (pendingDraft?.status === 'PENDING_APPROVAL') {
                return apiError('Cannot edit live syllabus while a draft is pending approval', 409, 'DRAFT_PENDING');
            }

            const body = await req.json();
            const snapshot = validateSyllabusSnapshotForSubmit(body?.snapshot);

            const result = await prisma.$transaction(async (tx) => {
                const liveSnapshot = await applySyllabusSnapshotToLive(tx, courseId, snapshot);

                const draft = await tx.syllabusDraft.upsert({
                    where: { courseId },
                    create: {
                        courseId,
                        snapshot: snapshotToJson(liveSnapshot),
                        status: 'DRAFT',
                        createdBy: user.id,
                        updatedBy: user.id,
                    },
                    update: {
                        snapshot: snapshotToJson(liveSnapshot),
                        status: 'DRAFT',
                        updatedBy: user.id,
                        submittedAt: null,
                        submittedBy: null,
                        reviewedAt: null,
                        reviewedBy: null,
                        reviewComment: null,
                    },
                    include: {
                        submitter: { select: { id: true, name: true } },
                        reviewer: { select: { id: true, name: true } },
                    },
                });

                return { liveSnapshot, draft };
            });

            await logAudit(user.id, 'SYLLABUS_LIVE_UPDATED', 'Course', courseId, {
                source: 'builder',
            });

            return apiSuccess({
                liveSnapshot: result.liveSnapshot,
                draft: {
                    id: result.draft.id,
                    status: result.draft.status,
                    snapshot: parseDraftSnapshot(result.draft.snapshot),
                    submittedAt: result.draft.submittedAt,
                    submittedBy: result.draft.submitter,
                    reviewedAt: result.draft.reviewedAt,
                    reviewedBy: result.draft.reviewer,
                    reviewComment: result.draft.reviewComment,
                    updatedAt: result.draft.updatedAt,
                },
            });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
