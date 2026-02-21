import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { courseSchema, formatZodErrors } from '@/lib/validations';
import { logAudit } from '@/lib/audit';

// GET /api/v1/courses — list courses
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const page = Math.max(1, Number(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '12')));
        const search = searchParams.get('search') || '';
        const level = searchParams.get('level');

        const where: Record<string, unknown> = {
            // Product model: only program-linked syllabus courses should surface in portals.
            program: { is: { status: 'ACTIVE' } },
        };
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (level) where.level = level;

        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                include: {
                    creator: { select: { id: true, name: true } },
                    _count: { select: { modules: true, enrollments: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.course.count({ where }),
        ]);

        return apiSuccess({
            courses,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/v1/courses — create course
export const POST = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            const body = await req.json();
            const parsed = courseSchema.safeParse(body);
            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
            }

            const slug = parsed.data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');

            const existingSlug = await prisma.course.findUnique({ where: { slug } });
            if (existingSlug) {
                return apiError('A course with a similar title already exists', 409, 'SLUG_EXISTS');
            }

            const course = await prisma.course.create({
                data: {
                    ...parsed.data,
                    slug,
                    createdBy: user.id,
                },
            });

            await logAudit(user.id, 'COURSE_CREATED', 'Course', course.id);

            return apiSuccess(course, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
