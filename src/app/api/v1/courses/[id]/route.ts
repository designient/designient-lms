import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { courseUpdateSchema, formatZodErrors } from '@/lib/validations';
import { logAudit } from '@/lib/audit';

// GET /api/v1/courses/[id]
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                creator: { select: { id: true, name: true } },
                modules: {
                    orderBy: { position: 'asc' },
                    include: {
                        lessons: { orderBy: { position: 'asc' }, select: { id: true, title: true, contentType: true, position: true } },
                    },
                },
                _count: { select: { enrollments: true } },
            },
        });

        if (!course) {
            return apiError('Course not found', 404, 'NOT_FOUND');
        }

        return apiSuccess(course);
    } catch (error) {
        return handleApiError(error);
    }
}

// PATCH /api/v1/courses/[id]
export const PATCH = withAuth(
    async (req: NextRequest, { params }, user) => {
        try {
            const { id } = await params;
            const body = await req.json();
            const parsed = courseUpdateSchema.safeParse(body);
            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
            }

            const course = await prisma.course.findUnique({ where: { id } });
            if (!course) return apiError('Course not found', 404, 'NOT_FOUND');

            if (user.role === 'INSTRUCTOR' && course.createdBy !== user.id) {
                return apiError('You can only edit your own courses', 403, 'FORBIDDEN');
            }

            const updated = await prisma.course.update({
                where: { id },
                data: parsed.data,
            });

            await logAudit(user.id, 'COURSE_UPDATED', 'Course', id);

            return apiSuccess(updated);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
