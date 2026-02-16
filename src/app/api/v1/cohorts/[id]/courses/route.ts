import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { logAudit } from '@/lib/audit';

// GET /api/v1/cohorts/[id]/courses - List courses assigned to cohort
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: cohortId } = await params;

        const cohort = await prisma.cohort.findUnique({ where: { id: cohortId } });
        if (!cohort) {
            return apiError('Cohort not found', 404, 'NOT_FOUND');
        }

        const cohortCourses = await prisma.cohortCourse.findMany({
            where: { cohortId },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        description: true,
                        level: true,
                        isPublished: true,
                        _count: { select: { modules: true, enrollments: true } },
                    },
                },
            },
            orderBy: { addedAt: 'desc' },
        });

        const courses = cohortCourses.map(cc => ({
            ...cc.course,
            addedAt: cc.addedAt,
            cohortCourseId: cc.id,
        }));

        return apiSuccess({ courses });
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/v1/cohorts/[id]/courses - Assign course to cohort + auto-enroll students
export const POST = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id: cohortId } = await ctx.params;
            const body = await req.json();
            const { courseId } = body;

            if (!courseId) {
                return apiError('courseId is required', 400, 'MISSING_FIELD');
            }

            // Verify cohort and course exist
            const [cohort, course] = await Promise.all([
                prisma.cohort.findUnique({ where: { id: cohortId } }),
                prisma.course.findUnique({ where: { id: courseId } }),
            ]);

            if (!cohort) return apiError('Cohort not found', 404, 'NOT_FOUND');
            if (!course) return apiError('Course not found', 404, 'NOT_FOUND');

            // Check if already assigned
            const existing = await prisma.cohortCourse.findUnique({
                where: { cohortId_courseId: { cohortId, courseId } },
            });
            if (existing) {
                return apiError('Course is already assigned to this cohort', 409, 'ALREADY_EXISTS');
            }

            // Create CohortCourse record
            const cohortCourse = await prisma.cohortCourse.create({
                data: { cohortId, courseId },
            });

            // Auto-enroll: find all students in this cohort
            const students = await prisma.studentProfile.findMany({
                where: { cohortId },
                select: { userId: true },
            });

            if (students.length > 0) {
                // Get existing enrollments for this course
                const existingEnrollments = await prisma.enrollment.findMany({
                    where: {
                        courseId,
                        userId: { in: students.map(s => s.userId) },
                    },
                    select: { userId: true },
                });
                const enrolledUserIds = new Set(existingEnrollments.map(e => e.userId));

                // Create enrollment records for students not yet enrolled
                const newEnrollments = students
                    .filter(s => !enrolledUserIds.has(s.userId))
                    .map(s => ({ userId: s.userId, courseId }));

                if (newEnrollments.length > 0) {
                    await prisma.enrollment.createMany({ data: newEnrollments });
                }
            }

            await logAudit(user.id, 'COURSE_ASSIGNED_TO_COHORT', 'CohortCourse', cohortCourse.id, {
                cohortId,
                courseId,
                autoEnrolled: students.length,
            } as Record<string, unknown>);

            return apiSuccess({ cohortCourse, autoEnrolled: students.length }, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN', 'INSTRUCTOR']
);

// DELETE /api/v1/cohorts/[id]/courses - Remove course from cohort
export const DELETE = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id: cohortId } = await ctx.params;
            const body = await req.json();
            const { courseId } = body;

            if (!courseId) {
                return apiError('courseId is required', 400, 'MISSING_FIELD');
            }

            const cohortCourse = await prisma.cohortCourse.findUnique({
                where: { cohortId_courseId: { cohortId, courseId } },
            });

            if (!cohortCourse) {
                return apiError('Course is not assigned to this cohort', 404, 'NOT_FOUND');
            }

            await prisma.cohortCourse.delete({
                where: { id: cohortCourse.id },
            });

            await logAudit(user.id, 'COURSE_REMOVED_FROM_COHORT', 'CohortCourse', cohortCourse.id, {
                cohortId,
                courseId,
            } as Record<string, unknown>);

            return apiSuccess({ message: 'Course removed from cohort' });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN', 'INSTRUCTOR']
);
