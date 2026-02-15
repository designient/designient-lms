import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { gradeSchema, formatZodErrors } from '@/lib/validations';
import { logAudit } from '@/lib/audit';

// POST /api/v1/submissions/[id]/grade
export const POST = withAuth(
    async (req: NextRequest, { params }, user) => {
        try {
            const { id: submissionId } = await params;

            const submission = await prisma.submission.findUnique({
                where: { id: submissionId },
                include: { assignment: { include: { course: true } }, grade: true },
            });
            if (!submission) return apiError('Submission not found', 404, 'NOT_FOUND');

            if (user.role === 'INSTRUCTOR' && submission.assignment.course.createdBy !== user.id) {
                return apiError('Forbidden', 403, 'FORBIDDEN');
            }

            const body = await req.json();
            const parsed = gradeSchema.safeParse(body);
            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
            }

            if (parsed.data.score > submission.assignment.maxScore) {
                return apiError(
                    `Score cannot exceed max score of ${submission.assignment.maxScore}`,
                    422,
                    'INVALID_SCORE'
                );
            }

            // Upsert grade
            const grade = await prisma.grade.upsert({
                where: { submissionId },
                create: {
                    submissionId,
                    gradedBy: user.id,
                    score: parsed.data.score,
                    feedback: parsed.data.feedback,
                },
                update: {
                    gradedBy: user.id,
                    score: parsed.data.score,
                    feedback: parsed.data.feedback,
                    gradedAt: new Date(),
                },
            });

            // Update submission status
            await prisma.submission.update({
                where: { id: submissionId },
                data: { status: 'GRADED' },
            });

            await logAudit(user.id, 'SUBMISSION_GRADED', 'Grade', grade.id, {
                submissionId,
                score: parsed.data.score,
            });

            return apiSuccess(grade);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
