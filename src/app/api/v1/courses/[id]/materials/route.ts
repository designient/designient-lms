import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { canInstructorAccessCourse, isStudentEnrolledInCourse } from '@/lib/access-control';

// GET /api/v1/courses/[id]/materials - List materials
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

            const materials = await prisma.classMaterial.findMany({
                where: { courseId: id },
                include: {
                    module: { select: { id: true, title: true } },
                },
                orderBy: { position: 'asc' },
            });

            return apiSuccess({ materials });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['STUDENT', 'INSTRUCTOR', 'ADMIN']
);

// POST /api/v1/courses/[id]/materials - Add material
export const POST = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;
            const body = await req.json();
            const { title, driveUrl, moduleId, position } = body;

            if (!title || !driveUrl) {
                return apiError('title and driveUrl are required', 400);
            }

            if (user.role === 'INSTRUCTOR') {
                const canAccess = await canInstructorAccessCourse(user.id, id);
                if (!canAccess) return apiError('Forbidden', 403, 'FORBIDDEN');
            }

            const material = await prisma.classMaterial.create({
                data: {
                    courseId: id,
                    title,
                    driveUrl,
                    moduleId: moduleId || null,
                    position: position || 0,
                },
            });

            return apiSuccess(material, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);

// DELETE /api/v1/courses/[id]/materials - Delete material
export const DELETE = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;
            const body = await req.json();
            const { materialId } = body;

            if (!materialId) return apiError('materialId is required', 400);

            const material = await prisma.classMaterial.findUnique({
                where: { id: materialId },
                select: { id: true, courseId: true },
            });
            if (!material) return apiError('Material not found', 404, 'NOT_FOUND');
            if (material.courseId !== id) return apiError('Material does not belong to this course', 400, 'BAD_REQUEST');

            if (user.role === 'INSTRUCTOR') {
                const canAccess = await canInstructorAccessCourse(user.id, id);
                if (!canAccess) return apiError('Forbidden', 403, 'FORBIDDEN');
            }

            await prisma.classMaterial.delete({ where: { id: materialId } });
            return apiSuccess({ message: 'Material deleted' });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
