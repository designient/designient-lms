import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/assignments/[id]/tasks - Get tasks for an assignment
export const GET = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;
            const studentId = req.nextUrl.searchParams.get('studentId') || user.id;

            const tasks = await prisma.assignmentTask.findMany({
                where: { assignmentId: id, studentId },
                orderBy: { position: 'asc' },
            });

            return apiSuccess({ tasks });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['STUDENT', 'INSTRUCTOR', 'ADMIN']
);

// POST /api/v1/assignments/[id]/tasks - Mentor creates a task
export const POST = withAuth(
    async (req: NextRequest, ctx) => {
        try {
            const { id } = await ctx.params;
            const { studentId, title, description, priority, dueAt } = await req.json();

            if (!studentId || !title) {
                return apiError('studentId and title are required', 400);
            }

            const count = await prisma.assignmentTask.count({ where: { assignmentId: id, studentId } });

            const task = await prisma.assignmentTask.create({
                data: {
                    assignmentId: id,
                    studentId,
                    title,
                    description: description || null,
                    priority: priority || 'MEDIUM',
                    dueAt: dueAt ? new Date(dueAt) : null,
                    position: count,
                },
            });

            return apiSuccess(task, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);

// PUT /api/v1/assignments/[id]/tasks - Update task status/notes
export const PUT = withAuth(
    async (req: NextRequest) => {
        try {
            const { taskId, status, notes, title, description, priority, dueAt } = await req.json();

            if (!taskId) return apiError('taskId is required', 400);

            const task = await prisma.assignmentTask.update({
                where: { id: taskId },
                data: {
                    ...(status && { status }),
                    ...(notes !== undefined && { notes }),
                    ...(title && { title }),
                    ...(description !== undefined && { description }),
                    ...(priority && { priority }),
                    ...(dueAt !== undefined && { dueAt: dueAt ? new Date(dueAt) : null }),
                },
            });

            return apiSuccess(task);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['STUDENT', 'INSTRUCTOR', 'ADMIN']
);

// DELETE /api/v1/assignments/[id]/tasks - Remove task
export const DELETE = withAuth(
    async (req: NextRequest) => {
        try {
            const { taskId } = await req.json();
            if (!taskId) return apiError('taskId is required', 400);

            await prisma.assignmentTask.delete({ where: { id: taskId } });
            return apiSuccess({ message: 'Task deleted' });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
