import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { programSchema, formatZodErrors } from '@/lib/validations';
import { logAudit } from '@/lib/audit';

// GET /api/v1/programs - List all programs
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const page = Math.max(1, Number(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '12')));
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status');

        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Fix: Use Prisma Enum type or string assertion if strict, 
        // passing string directly usually works if it matches enum value
        if (status) {
            where.status = status;
        }

        const [programs, total] = await Promise.all([
            prisma.program.findMany({
                where,
                include: {
                    course: { select: { id: true, title: true, isPublished: true, _count: { select: { modules: true, enrollments: true } } } },
                    _count: { select: { cohorts: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.program.count({ where }),
        ]);

        return apiSuccess({
            programs,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });

    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/v1/programs - Create new program
export const POST = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            const body = await req.json();
            const parsed = programSchema.safeParse(body);

            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
            }

            const slug = parsed.data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');

            const existingSlug = await prisma.program.findUnique({ where: { slug } });
            if (existingSlug) {
                return apiError('A program with this name already exists', 409, 'SLUG_EXISTS');
            }

            const program = await prisma.program.create({
                data: {
                    ...parsed.data,
                    slug,
                },
            });

            const course = await prisma.course.create({
                data: {
                    title: parsed.data.name,
                    slug: `${slug}-course-${Date.now()}`,
                    description: parsed.data.description || '',
                    createdBy: user.id,
                },
            });

            const linked = await prisma.program.update({
                where: { id: program.id },
                data: { courseId: course.id },
                include: {
                    course: { select: { id: true, title: true, isPublished: true, _count: { select: { modules: true } } } },
                },
            });

            await logAudit(user.id, 'PROGRAM_CREATED', 'Program', program.id);

            return apiSuccess(linked, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN', 'INSTRUCTOR'] // Only Admin and Instructors can create programs
);
