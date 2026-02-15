import prisma from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/admin/dashboard/summary
export const GET = withAuth(
    async () => {
        try {
            const [
                totalUsers,
                totalStudents,
                totalInstructors,
                totalCourses,
                publishedCourses,
                totalEnrollments,
                pendingSubmissions,
                gradedSubmissions,
                recentEnrollments,
            ] = await Promise.all([
                prisma.user.count(),
                prisma.user.count({ where: { role: 'STUDENT' } }),
                prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
                prisma.course.count(),
                prisma.course.count({ where: { isPublished: true } }),
                prisma.enrollment.count(),
                prisma.submission.count({ where: { status: 'SUBMITTED' } }),
                prisma.submission.count({ where: { status: 'GRADED' } }),
                prisma.enrollment.findMany({
                    take: 5,
                    orderBy: { enrolledAt: 'desc' },
                    include: {
                        user: { select: { name: true, email: true } },
                        course: { select: { title: true } },
                    },
                }),
            ]);

            // Enrollment count by course
            const enrollmentsByCourse = await prisma.course.findMany({
                where: { isPublished: true },
                select: {
                    id: true,
                    title: true,
                    _count: { select: { enrollments: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            });

            return apiSuccess({
                users: { total: totalUsers, students: totalStudents, instructors: totalInstructors },
                courses: { total: totalCourses, published: publishedCourses },
                enrollments: { total: totalEnrollments },
                submissions: { pending: pendingSubmissions, graded: gradedSubmissions },
                recentEnrollments,
                enrollmentsByCourse,
            });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
