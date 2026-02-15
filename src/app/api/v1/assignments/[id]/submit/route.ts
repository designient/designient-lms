import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { uploadFile } from '@/lib/s3';
import { logAudit } from '@/lib/audit';

// POST /api/v1/assignments/[id]/submit — multipart file upload
export const POST = withAuth(
    async (req: NextRequest, { params }, user) => {
        try {
            const { id: assignmentId } = await params;

            const assignment = await prisma.assignment.findUnique({
                where: { id: assignmentId },
                include: { course: true },
            });
            if (!assignment) return apiError('Assignment not found', 404, 'NOT_FOUND');
            if (!assignment.isPublished) return apiError('Assignment not available', 400, 'NOT_PUBLISHED');

            // Check enrollment
            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: user.id,
                        courseId: assignment.courseId,
                    },
                },
            });
            if (!enrollment) return apiError('Not enrolled in this course', 403, 'NOT_ENROLLED');

            // Check resubmission policy (max 2 attempts)
            const existingSubmissions = await prisma.submission.count({
                where: { assignmentId, studentId: user.id },
            });
            if (existingSubmissions >= 2) {
                return apiError('Maximum submission attempts reached', 400, 'MAX_ATTEMPTS');
            }

            const formData = await req.formData();
            const file = formData.get('file') as File | null;
            const notes = formData.get('notes') as string | null;

            if (!file) return apiError('File is required', 422, 'FILE_REQUIRED');

            const fileUrl = await uploadFile(file);

            const status = existingSubmissions > 0 ? 'RESUBMITTED' : 'SUBMITTED';

            const submission = await prisma.submission.create({
                data: {
                    assignmentId,
                    studentId: user.id,
                    fileUrl,
                    notes,
                    attemptNo: existingSubmissions + 1,
                    status,
                },
            });

            await logAudit(user.id, 'SUBMISSION_CREATED', 'Submission', submission.id, {
                assignmentId,
            });

            return apiSuccess(submission, 201);
        } catch (error) {
            if (error instanceof Error && error.message.includes('File')) {
                return apiError(error.message, 422, 'FILE_VALIDATION');
            }
            return handleApiError(error);
        }
    },
    ['STUDENT']
);
