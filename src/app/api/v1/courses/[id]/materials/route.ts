import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/courses/[id]/materials - List materials
export const GET = withAuth(
    async (_req: NextRequest, ctx) => {
        try {
            const { id } = await ctx.params;

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
    async (req: NextRequest, ctx) => {
        try {
            const { id } = await ctx.params;
            const body = await req.json();
            const { title, driveUrl, moduleId, position } = body;

            if (!title || !driveUrl) {
                return apiError('title and driveUrl are required', 400);
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
    async (req: NextRequest) => {
        try {
            const body = await req.json();
            const { materialId } = body;

            if (!materialId) return apiError('materialId is required', 400);

            await prisma.classMaterial.delete({ where: { id: materialId } });
            return apiSuccess({ message: 'Material deleted' });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
