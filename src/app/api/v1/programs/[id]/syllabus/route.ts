import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { ensureAllCohortStudentsEnrolled } from '@/lib/cohort-curriculum';
import { logAudit } from '@/lib/audit';

function makeCourseSlug(input: string): string {
    return `${input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}`;
}

// POST /api/v1/programs/[id]/syllabus - create or link syllabus course to a program
export const POST = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id: programId } = await ctx.params;
            const body = await req.json().catch(() => ({}));
            const requestedCourseId = typeof body?.courseId === 'string' ? body.courseId : undefined;

            const program = await prisma.program.findUnique({
                where: { id: programId },
                include: {
                    course: { select: { id: true, title: true, isPublished: true, _count: { select: { modules: true, enrollments: true } } } },
                    cohorts: { select: { id: true } },
                },
            });

            if (!program) return apiError('Program not found', 404, 'NOT_FOUND');

            let targetCourseId = requestedCourseId || program.courseId || null;
            if (!targetCourseId) {
                const course = await prisma.course.create({
                    data: {
                        title: `${program.name} Syllabus`,
                        slug: makeCourseSlug(`${program.slug}-syllabus`),
                        description: program.description || '',
                        createdBy: user.id,
                    },
                });
                targetCourseId = course.id;
            } else if (requestedCourseId) {
                const existingCourse = await prisma.course.findUnique({
                    where: { id: requestedCourseId },
                    select: { id: true },
                });
                if (!existingCourse) return apiError('Course not found', 404, 'NOT_FOUND');
            }

            const updated = await prisma.program.update({
                where: { id: programId },
                data: { courseId: targetCourseId },
                include: {
                    course: { select: { id: true, title: true, isPublished: true, _count: { select: { modules: true, enrollments: true } } } },
                },
            });

            for (const cohort of program.cohorts) {
                await ensureAllCohortStudentsEnrolled(cohort.id, targetCourseId ? [targetCourseId] : []);
            }

            await logAudit(user.id, 'PROGRAM_SYLLABUS_LINKED', 'Program', programId, {
                courseId: targetCourseId,
            });

            return apiSuccess(updated);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN', 'INSTRUCTOR']
);
