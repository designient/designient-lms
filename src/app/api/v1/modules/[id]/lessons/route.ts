import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { lessonSchema, formatZodErrors } from '@/lib/validations';

export const POST = withAuth(
    async (req: NextRequest, { params }, user) => {
        try {
            const { id: moduleId } = await params;

            const mod = await prisma.module.findUnique({
                where: { id: moduleId },
                include: { course: true },
            });
            if (!mod) return apiError('Module not found', 404, 'NOT_FOUND');

            if (user.role === 'INSTRUCTOR') {
                return apiError('Mentors cannot edit live syllabus directly. Use draft flow.', 403, 'FORBIDDEN');
            }

            const body = await req.json();
            const parsed = lessonSchema.safeParse(body);
            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
            }

            if (parsed.data.position === undefined) {
                const lastLesson = await prisma.lesson.findFirst({
                    where: { moduleId },
                    orderBy: { position: 'desc' },
                });
                parsed.data.position = (lastLesson?.position ?? -1) + 1;
            }

            const lesson = await prisma.lesson.create({
                data: { ...parsed.data, moduleId },
            });

            return apiSuccess(lesson, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
