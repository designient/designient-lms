import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/me/attendance - Student's own attendance
export const GET = withAuth(
    async (_req: NextRequest, _ctx, user) => {
        try {
            const attendances = await prisma.attendance.findMany({
                where: { studentId: user.id },
                include: {
                    session: {
                        select: {
                            id: true,
                            title: true,
                            scheduledAt: true,
                            courseId: true,
                            course: { select: { title: true } },
                            cohortId: true,
                            cohort: { select: { name: true } },
                        },
                    },
                },
                orderBy: { session: { scheduledAt: 'desc' } },
            });

            // Calculate percentage
            const total = attendances.length;
            const present = attendances.filter(
                a => a.status === 'PRESENT' || a.status === 'LATE'
            ).length;
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

            // Group by course
            const byCourse = new Map<string, { courseTitle: string; total: number; present: number }>();
            attendances.forEach(a => {
                const cid = a.session.courseId || 'unknown';
                const existing = byCourse.get(cid);
                const isPresent = a.status === 'PRESENT' || a.status === 'LATE';
                if (existing) {
                    existing.total++;
                    if (isPresent) existing.present++;
                } else {
                    byCourse.set(cid, {
                        courseTitle: a.session.course?.title || 'General',
                        total: 1,
                        present: isPresent ? 1 : 0,
                    });
                }
            });

            const courseBreakdown = Array.from(byCourse.entries()).map(([courseId, data]) => ({
                courseId,
                courseTitle: data.courseTitle,
                total: data.total,
                present: data.present,
                percentage: Math.round((data.present / data.total) * 100),
            }));

            return apiSuccess({
                attendances: attendances.map(a => ({
                    id: a.id,
                    status: a.status,
                    sessionTitle: a.session.title,
                    courseTitle: a.session.course?.title || 'General',
                    cohortName: a.session.cohort.name,
                    scheduledAt: a.session.scheduledAt,
                })),
                summary: { total, present, percentage },
                courseBreakdown,
            });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['STUDENT', 'INSTRUCTOR', 'ADMIN']
);
