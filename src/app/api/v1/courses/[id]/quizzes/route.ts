import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import {
    canInstructorAccessCourse,
    isCourseInCohort,
    isMentorAssignedToCohort,
    isStudentEnrolledInCourse,
} from '@/lib/access-control';

// GET /api/v1/courses/[id]/quizzes - List quizzes for a course
export const GET = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;
            const cohortId = req.nextUrl.searchParams.get('cohortId') || undefined;
            const course = await prisma.course.findUnique({
                where: { id },
                select: { createdBy: true },
            });
            if (!course) return apiError('Course not found', 404, 'NOT_FOUND');

            const where: Record<string, unknown> = { courseId: id };

            if (user.role === 'STUDENT') {
                const enrolled = await isStudentEnrolledInCourse(user.id, id);
                if (!enrolled) return apiError('Not enrolled in this course', 403, 'NOT_ENROLLED');

                const student = await prisma.studentProfile.findUnique({
                    where: { userId: user.id },
                    select: { cohortId: true },
                });
                if (!student?.cohortId) return apiSuccess({ quizzes: [] });

                if (cohortId && cohortId !== student.cohortId) {
                    return apiError('Forbidden', 403, 'FORBIDDEN');
                }
                where.cohortId = student.cohortId;
                where.isPublished = true;
            } else if (user.role === 'INSTRUCTOR') {
                const canAccess = await canInstructorAccessCourse(user.id, id);
                if (!canAccess) return apiError('Forbidden', 403, 'FORBIDDEN');

                if (course.createdBy === user.id) {
                    if (cohortId) where.cohortId = cohortId;
                } else {
                    const mentor = await prisma.mentorProfile.findUnique({
                        where: { userId: user.id },
                        include: { cohorts: { select: { id: true } } },
                    });
                    const allowedCohortIds = mentor?.cohorts.map(c => c.id) || [];

                    if (cohortId && !allowedCohortIds.includes(cohortId)) {
                        return apiError('Forbidden', 403, 'FORBIDDEN');
                    }
                    where.cohortId = cohortId || { in: allowedCohortIds };
                }
            } else if (cohortId) {
                where.cohortId = cohortId;
            }

            const quizzes = await prisma.quiz.findMany({
                where,
                include: {
                    _count: { select: { questions: true, attempts: true } },
                    cohort: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
            });

            return apiSuccess({ quizzes });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['STUDENT', 'INSTRUCTOR', 'ADMIN']
);

// POST /api/v1/courses/[id]/quizzes - Create quiz
export const POST = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;
            const { title, cohortId, timeLimit, maxAttempts, availableFrom, availableUntil } = await req.json();

            if (!title || !cohortId) {
                return apiError('title and cohortId are required', 400);
            }

            const course = await prisma.course.findUnique({
                where: { id },
                select: { createdBy: true },
            });
            if (!course) return apiError('Course not found', 404, 'NOT_FOUND');

            if (user.role === 'INSTRUCTOR') {
                const canAccess = await canInstructorAccessCourse(user.id, id);
                if (!canAccess) return apiError('Forbidden', 403, 'FORBIDDEN');

                if (course.createdBy !== user.id) {
                    const assigned = await isMentorAssignedToCohort(user.id, cohortId);
                    if (!assigned) return apiError('Forbidden', 403, 'FORBIDDEN');
                }
            }

            const courseMappedToCohort = await isCourseInCohort(cohortId, id);
            if (!courseMappedToCohort) {
                return apiError('Selected cohort does not include this course', 422, 'VALIDATION_ERROR');
            }

            const quiz = await prisma.quiz.create({
                data: {
                    courseId: id,
                    cohortId,
                    title,
                    timeLimit: timeLimit || null,
                    maxAttempts: maxAttempts || 1,
                    availableFrom: availableFrom ? new Date(availableFrom) : null,
                    availableUntil: availableUntil ? new Date(availableUntil) : null,
                },
            });

            return apiSuccess(quiz, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
