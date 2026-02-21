import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import {
    canInstructorAccessAssignment,
    canInstructorAccessCourse,
    isStudentEnrolledInCourse,
    isStudentInCourseScope,
} from '@/lib/access-control';

// GET /api/v1/assignments/[id]/tasks - Get tasks for an assignment
export const GET = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;
            const assignment = await prisma.assignment.findUnique({
                where: { id },
                select: { id: true, courseId: true },
            });
            if (!assignment) return apiError('Assignment not found', 404, 'NOT_FOUND');

            const requestedStudentId = req.nextUrl.searchParams.get('studentId');
            const studentId = user.role === 'STUDENT' ? user.id : (requestedStudentId || user.id);

            if (user.role === 'STUDENT') {
                const enrolled = await isStudentEnrolledInCourse(user.id, assignment.courseId);
                if (!enrolled) return apiError('Not enrolled in this course', 403, 'NOT_ENROLLED');
            }

            if (user.role === 'INSTRUCTOR') {
                const access = await canInstructorAccessAssignment(user.id, id);
                if (!access.allowed) return apiError('Forbidden', 403, 'FORBIDDEN');
            }

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
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;
            const { studentId, title, description, priority, dueAt } = await req.json();

            if (!studentId || !title) {
                return apiError('studentId and title are required', 400);
            }

            if (user.role === 'INSTRUCTOR') {
                const access = await canInstructorAccessAssignment(user.id, id);
                if (!access.exists) return apiError('Assignment not found', 404, 'NOT_FOUND');
                if (!access.allowed) return apiError('Forbidden', 403, 'FORBIDDEN');
                if (!access.courseId) return apiError('Assignment course not found', 404, 'NOT_FOUND');

                const inScope = await isStudentInCourseScope(studentId, access.courseId);
                if (!inScope) {
                    return apiError('Student is not in an assigned cohort for this course', 403, 'FORBIDDEN');
                }
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
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;
            const { taskId, status, notes, title, description, priority, dueAt } = await req.json();

            if (!taskId) return apiError('taskId is required', 400);

            const existingTask = await prisma.assignmentTask.findUnique({
                where: { id: taskId },
                include: {
                    assignment: { select: { id: true, courseId: true } },
                },
            });
            if (!existingTask) return apiError('Task not found', 404, 'NOT_FOUND');
            if (existingTask.assignment.id !== id) return apiError('Task does not belong to this assignment', 400, 'BAD_REQUEST');

            if (user.role === 'STUDENT') {
                if (existingTask.studentId !== user.id) return apiError('Forbidden', 403, 'FORBIDDEN');
                const enrolled = await isStudentEnrolledInCourse(user.id, existingTask.assignment.courseId);
                if (!enrolled) return apiError('Not enrolled in this course', 403, 'NOT_ENROLLED');
                if (title !== undefined || description !== undefined || priority !== undefined || dueAt !== undefined) {
                    return apiError('Students can only update status or notes', 403, 'FORBIDDEN');
                }
            }

            if (user.role === 'INSTRUCTOR') {
                const canAccess = await canInstructorAccessCourse(user.id, existingTask.assignment.courseId);
                if (!canAccess) return apiError('Forbidden', 403, 'FORBIDDEN');
            }

            const task = await prisma.assignmentTask.update({
                where: { id: taskId },
                data: {
                    ...(status && { status }),
                    ...(status && { completedAt: status === 'DONE' ? new Date() : null }),
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
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;
            const { taskId } = await req.json();
            if (!taskId) return apiError('taskId is required', 400);

            const task = await prisma.assignmentTask.findUnique({
                where: { id: taskId },
                include: {
                    assignment: { select: { id: true, courseId: true } },
                },
            });
            if (!task) return apiError('Task not found', 404, 'NOT_FOUND');
            if (task.assignment.id !== id) return apiError('Task does not belong to this assignment', 400, 'BAD_REQUEST');

            if (user.role === 'INSTRUCTOR') {
                const canAccess = await canInstructorAccessCourse(user.id, task.assignment.courseId);
                if (!canAccess) return apiError('Forbidden', 403, 'FORBIDDEN');
            }

            await prisma.assignmentTask.delete({ where: { id: taskId } });
            return apiSuccess({ message: 'Task deleted' });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
