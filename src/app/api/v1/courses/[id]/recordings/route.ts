import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { canInstructorAccessCourse, isStudentEnrolledInCourse } from '@/lib/access-control';

// GET /api/v1/courses/[id]/recordings - List recordings
export const GET = withAuth(
    async (_req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;
            const course = await prisma.course.findUnique({
                where: { id },
                select: { id: true },
            });
            if (!course) return apiError('Course not found', 404, 'NOT_FOUND');

            if (user.role === 'STUDENT') {
                const enrolled = await isStudentEnrolledInCourse(user.id, id);
                if (!enrolled) return apiError('Not enrolled in this course', 403, 'NOT_ENROLLED');
            }

            if (user.role === 'INSTRUCTOR') {
                const canAccess = await canInstructorAccessCourse(user.id, id);
                if (!canAccess) return apiError('Forbidden', 403, 'FORBIDDEN');
            }

            const recordings = await prisma.classRecording.findMany({
                where: { courseId: id },
                include: {
                    module: { select: { id: true, title: true } },
                },
                orderBy: { position: 'asc' },
            });

            return apiSuccess({ recordings });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['STUDENT', 'INSTRUCTOR', 'ADMIN']
);

// POST /api/v1/courses/[id]/recordings - Add recording
export const POST = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;
            const body = await req.json();
            const { title, youtubeUrl, moduleId, position } = body;

            if (!title || !youtubeUrl) {
                return apiError('title and youtubeUrl are required', 400);
            }

            if (user.role === 'INSTRUCTOR') {
                const canAccess = await canInstructorAccessCourse(user.id, id);
                if (!canAccess) return apiError('Forbidden', 403, 'FORBIDDEN');
            }

            const recording = await prisma.classRecording.create({
                data: {
                    courseId: id,
                    title,
                    youtubeUrl,
                    moduleId: moduleId || null,
                    position: position || 0,
                },
            });

            return apiSuccess(recording, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);

// DELETE /api/v1/courses/[id]/recordings - Delete recording
export const DELETE = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;
            const body = await req.json();
            const { recordingId } = body;

            if (!recordingId) return apiError('recordingId is required', 400);

            const recording = await prisma.classRecording.findUnique({
                where: { id: recordingId },
                select: { id: true, courseId: true },
            });
            if (!recording) return apiError('Recording not found', 404, 'NOT_FOUND');
            if (recording.courseId !== id) return apiError('Recording does not belong to this course', 400, 'BAD_REQUEST');

            if (user.role === 'INSTRUCTOR') {
                const canAccess = await canInstructorAccessCourse(user.id, id);
                if (!canAccess) return apiError('Forbidden', 403, 'FORBIDDEN');
            }

            await prisma.classRecording.delete({ where: { id: recordingId } });
            return apiSuccess({ message: 'Recording deleted' });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
