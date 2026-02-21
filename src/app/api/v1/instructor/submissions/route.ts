import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/instructor/submissions - Submissions for mentor's courses
export const GET = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            const { searchParams } = req.nextUrl;
            const status = searchParams.get('status') || '';
            const page = Math.max(1, Number(searchParams.get('page') || '1'));
            const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '12')));

            let cohortIds: string[] = [];
            if (user.role === 'INSTRUCTOR') {
                const mentor = await prisma.mentorProfile.findUnique({
                    where: { userId: user.id },
                    include: { cohorts: { select: { id: true } } },
                });
                cohortIds = mentor?.cohorts.map(c => c.id) || [];
            }

            const where: Record<string, unknown> = user.role === 'ADMIN'
                ? {}
                : {
                    assignment: {
                        course: {
                            OR: [
                                { cohortCourses: { some: { cohortId: { in: cohortIds } } } },
                                { program: { cohorts: { some: { id: { in: cohortIds } } } } },
                            ],
                        },
                    },
                };

            if (status) {
                where.status = status;
            }

            const [submissions, total] = await Promise.all([
                prisma.submission.findMany({
                    where,
                    include: {
                        student: { select: { id: true, name: true, email: true } },
                        grade: { select: { score: true, feedback: true } },
                        assignment: {
                            select: {
                                id: true,
                                title: true,
                                course: {
                                    select: { id: true, title: true },
                                },
                                module: {
                                    select: {
                                        course: { select: { id: true, title: true } },
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { submittedAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma.submission.count({ where }),
            ]);

            const flattened = submissions.map(s => ({
                id: s.id,
                studentName: s.student.name,
                studentEmail: s.student.email,
                assignmentTitle: s.assignment.title,
                courseName: s.assignment.course?.title || s.assignment.module?.course.title || 'Unknown',
                status: s.status,
                submittedAt: s.submittedAt,
                grade: s.grade?.score != null ? String(s.grade.score) : null,
                feedback: s.grade?.feedback || null,
                fileUrl: s.fileUrl,
            }));

            return apiSuccess({
                submissions: flattened,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
