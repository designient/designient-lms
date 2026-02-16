import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/courses/[id]/recordings - List recordings
export const GET = withAuth(
    async (_req: NextRequest, ctx) => {
        try {
            const { id } = await ctx.params;

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
    async (req: NextRequest, ctx) => {
        try {
            const { id } = await ctx.params;
            const body = await req.json();
            const { title, youtubeUrl, moduleId, position } = body;

            if (!title || !youtubeUrl) {
                return apiError('title and youtubeUrl are required', 400);
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
    async (req: NextRequest) => {
        try {
            const body = await req.json();
            const { recordingId } = body;

            if (!recordingId) return apiError('recordingId is required', 400);

            await prisma.classRecording.delete({ where: { id: recordingId } });
            return apiSuccess({ message: 'Recording deleted' });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
