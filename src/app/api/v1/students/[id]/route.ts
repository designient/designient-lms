import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { studentProfileUpdateSchema, formatZodErrors } from '@/lib/validations';
import { logAudit } from '@/lib/audit';

// GET /api/v1/students/[id] - Get student details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: studentId } = await params;
        const student = await prisma.studentProfile.findUnique({
            where: { id: studentId },
            include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true } },
                cohort: { select: { id: true, name: true, startDate: true, endDate: true } },
                notes: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: { author: { select: { name: true } } }
                }
            }
        });

        if (!student) {
            return apiError('Student not found', 404, 'NOT_FOUND');
        }

        return apiSuccess({
            ...student,
            name: student.user.name,
            email: student.user.email,
            avatarUrl: student.user.avatarUrl,
            joinDate: student.user.createdAt,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// PUT /api/v1/students/[id] - Update student profile
export const PUT = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;
            const body = await req.json();
            const parsed = studentProfileUpdateSchema.safeParse(body);

            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
            }

            const existing = await prisma.studentProfile.findUnique({ where: { id } });
            if (!existing) {
                return apiError('Student not found', 404, 'NOT_FOUND');
            }

            const updatedStudent = await prisma.studentProfile.update({
                where: { id },
                data: parsed.data,
            });

            // Auto-enroll in new cohort's courses if cohort changed
            if (parsed.data.cohortId && parsed.data.cohortId !== existing.cohortId) {
                const cohortCourses = await prisma.cohortCourse.findMany({
                    where: { cohortId: parsed.data.cohortId },
                    select: { courseId: true },
                });

                if (cohortCourses.length > 0) {
                    const existingEnrollments = await prisma.enrollment.findMany({
                        where: {
                            userId: existing.userId,
                            courseId: { in: cohortCourses.map(cc => cc.courseId) },
                        },
                        select: { courseId: true },
                    });
                    const enrolledCourseIds = new Set(existingEnrollments.map(e => e.courseId));

                    const newEnrollments = cohortCourses
                        .filter(cc => !enrolledCourseIds.has(cc.courseId))
                        .map(cc => ({ userId: existing.userId, courseId: cc.courseId }));

                    if (newEnrollments.length > 0) {
                        await prisma.enrollment.createMany({ data: newEnrollments });
                    }
                }
            }

            await logAudit(user.id, 'STUDENT_UPDATED', 'StudentProfile', id, parsed.data as Record<string, unknown>);

            return apiSuccess(updatedStudent);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN', 'INSTRUCTOR', 'ADMIN']
);

// DELETE /api/v1/students/[id] - Permanently delete student
export const DELETE = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;

            const student = await prisma.studentProfile.findUnique({
                where: { id },
                select: { userId: true }
            });

            if (!student) {
                return apiError('Student not found', 404, 'NOT_FOUND');
            }

            // Hard delete the User (cascades to StudentProfile, Enrollments, etc.)
            await prisma.user.delete({
                where: { id: student.userId }
            });

            await logAudit(user.id, 'STUDENT_DELETED', 'User', student.userId);

            return apiSuccess({ message: 'Student permanently deleted' });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
