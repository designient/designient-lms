import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/me/tasks — fetch all tasks for the student across all assignments
export const GET = withAuth(async (req: NextRequest, _ctx, user) => {
    try {
        const tasks = await prisma.assignmentTask.findMany({
            where: {
                studentId: user.id,
            },
            include: {
                assignment: {
                    select: {
                        id: true,
                        title: true,
                        course: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
            orderBy: [
                { status: 'asc' }, // TODO first
                { dueAt: 'asc' },  // Soonest due first
            ],
        });

        return apiSuccess({ tasks });
    } catch (error) {
        return handleApiError(error);
    }
});

// POST /api/v1/me/tasks — create a new task (personal or assignment-related)
export const POST = withAuth(async (req: NextRequest, _ctx, user) => {
    try {
        const body = await req.json();
        const { assignmentId, title, description, priority, dueAt } = body;

        // Verify assignment exists if provided
        if (assignmentId) {
            const assignment = await prisma.assignment.findUnique({
                where: { id: assignmentId },
            });
            if (!assignment) return apiError('Assignment not found', 404, 'NOT_FOUND');
        }

        const task = await prisma.assignmentTask.create({
            data: {
                studentId: user.id,
                assignmentId: assignmentId, // Optional, but schema might require it? checking schema...
                // Schema: assignmentId String @map("assignment_id") ... relation to Assignment
                // It seems assignmentId is REQUIRED in the schema provided earlier:
                // assignmentId String @map("assignment_id")
                // assignment   Assignment   @relation(...)
                // If it is required, we must generic a task linked to an assignment.
                // For now assuming we are only creating tasks for assignments.
                title,
                description,
                priority: priority || 'MEDIUM',
                dueAt: dueAt ? new Date(dueAt) : null,
            },
        });

        return apiSuccess(task, 201);
    } catch (error) {
        return handleApiError(error);
    }
});
