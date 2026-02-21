import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { moduleSchema, formatZodErrors } from '@/lib/validations';

export const POST = withAuth(
    async (req: NextRequest, { params }, user) => {
        try {
            const { id: courseId } = await params;

            const course = await prisma.course.findUnique({ where: { id: courseId } });
            if (!course) return apiError('Course not found', 404, 'NOT_FOUND');

            if (user.role === 'INSTRUCTOR') {
                return apiError('Mentors cannot edit live syllabus directly. Use draft flow.', 403, 'FORBIDDEN');
            }

            const body = await req.json();
            const parsed = moduleSchema.safeParse(body);
            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
            }

            // Auto-position if not specified
            if (parsed.data.position === undefined) {
                const lastModule = await prisma.module.findFirst({
                    where: { courseId },
                    orderBy: { position: 'desc' },
                });
                parsed.data.position = (lastModule?.position ?? -1) + 1;
            }

            const mod = await prisma.module.create({
                data: { ...parsed.data, courseId },
            });

            return apiSuccess(mod, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
