import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { assignmentSchema, formatZodErrors } from '@/lib/validations';
import { canInstructorAccessCourse, isStudentEnrolledInCourse } from '@/lib/access-control';

// GET /api/v1/courses/[id]/assignments
export const GET = withAuth(
    async (req: NextRequest, { params }, user) => {
        try {
            const { id: courseId } = await params;
            const { searchParams } = req.nextUrl;
            const page = Math.max(1, Number(searchParams.get('page') || '1'));
            const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')));

            const course = await prisma.course.findUnique({
                where: { id: courseId },
                select: { id: true },
            });
            if (!course) return apiError('Course not found', 404, 'NOT_FOUND');

            if (user.role === 'STUDENT') {
                const enrolled = await isStudentEnrolledInCourse(user.id, courseId);
                if (!enrolled) return apiError('Not enrolled in this course', 403, 'NOT_ENROLLED');
            }

            if (user.role === 'INSTRUCTOR') {
                const canAccess = await canInstructorAccessCourse(user.id, courseId);
                if (!canAccess) return apiError('Forbidden', 403, 'FORBIDDEN');
            }

            // Students only see published assignments
            const where: Record<string, unknown> = { courseId };
            if (user.role === 'STUDENT') {
                where.isPublished = true;
            }

            const [assignments, total] = await Promise.all([
                prisma.assignment.findMany({
                    where,
                    include: {
                        _count: { select: { submissions: true } },
                        module: { select: { id: true, title: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma.assignment.count({ where }),
            ]);

            return apiSuccess({
                assignments,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            });
        } catch (error) {
            return handleApiError(error);
        }
    }
);

// POST /api/v1/courses/[id]/assignments
export const POST = withAuth(
    async (req: NextRequest, { params }, user) => {
        try {
            const { id: courseId } = await params;

            const course = await prisma.course.findUnique({ where: { id: courseId } });
            if (!course) return apiError('Course not found', 404, 'NOT_FOUND');

            if (user.role === 'INSTRUCTOR') {
                const canAccess = await canInstructorAccessCourse(user.id, courseId);
                if (!canAccess) return apiError('Forbidden', 403, 'FORBIDDEN');
            }

            const body = await req.json();
            const parsed = assignmentSchema.safeParse(body);
            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
            }

            const assignment = await prisma.assignment.create({
                data: {
                    ...parsed.data,
                    courseId,
                    createdBy: user.id,
                },
            });

            return apiSuccess(assignment, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
