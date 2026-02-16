import prisma from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/admin/dashboard/summary
export const GET = withAuth(
    async () => {
        try {
            const [
                totalPrograms,
                activePrograms,
                totalCohorts,
                activeCohorts,
                upcomingCohorts,
                totalStudents,
                activeStudents,
                invitedStudents,
                flaggedStudents,
                droppedStudents,
                completedStudents,
                totalMentors,
                activeMentors,
                recentStudents,
                topCohorts,
            ] = await Promise.all([
                prisma.program.count(),
                prisma.program.count({ where: { status: 'ACTIVE' } }),
                prisma.cohort.count(),
                prisma.cohort.count({ where: { status: 'ACTIVE' } }),
                prisma.cohort.count({ where: { status: 'UPCOMING' } }),
                prisma.studentProfile.count(),
                prisma.studentProfile.count({ where: { status: 'ACTIVE' } }),
                prisma.studentProfile.count({ where: { status: 'INVITED' } }),
                prisma.studentProfile.count({ where: { status: 'FLAGGED' } }),
                prisma.studentProfile.count({ where: { status: 'DROPPED' } }),
                prisma.studentProfile.count({ where: { status: 'COMPLETED' } }),
                prisma.mentorProfile.count(),
                prisma.mentorProfile.count({ where: { status: 'ACTIVE' } }),
                prisma.studentProfile.findMany({
                    take: 10,
                    orderBy: { enrollmentDate: 'desc' },
                    include: {
                        user: { select: { name: true, email: true } },
                        cohort: { select: { name: true } },
                    },
                }),
                prisma.cohort.findMany({
                    take: 5,
                    include: {
                        program: { select: { name: true } },
                        _count: { select: { students: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
            ]);

            // Enrollment trend: student enrollments grouped by month for last 6 months
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            sixMonthsAgo.setDate(1);
            sixMonthsAgo.setHours(0, 0, 0, 0);

            const recentEnrollments = await prisma.studentProfile.findMany({
                where: { enrollmentDate: { gte: sixMonthsAgo } },
                select: { enrollmentDate: true },
                orderBy: { enrollmentDate: 'asc' },
            });

            const enrollmentTrend: { month: string; count: number }[] = [];
            const monthMap = new Map<string, number>();
            for (let i = 0; i < 6; i++) {
                const d = new Date();
                d.setMonth(d.getMonth() - (5 - i));
                const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
                monthMap.set(key, 0);
            }
            for (const s of recentEnrollments) {
                const key = new Date(s.enrollmentDate).toLocaleString('en-US', { month: 'short', year: '2-digit' });
                if (monthMap.has(key)) {
                    monthMap.set(key, (monthMap.get(key) || 0) + 1);
                }
            }
            for (const [month, count] of monthMap) {
                enrollmentTrend.push({ month, count });
            }

            // Sort top cohorts by student count descending
            const sortedTopCohorts = topCohorts
                .map(c => ({
                    name: c.name,
                    programName: c.program.name,
                    studentCount: c._count.students,
                    capacity: c.capacity,
                }))
                .sort((a, b) => b.studentCount - a.studentCount);

            // Flatten recent students
            const flatRecentStudents = recentStudents.map(s => ({
                id: s.id,
                name: s.user.name || 'Unknown',
                email: s.user.email,
                cohortName: s.cohort?.name || 'Unassigned',
                enrollmentDate: s.enrollmentDate.toISOString(),
                status: s.status,
            }));

            return apiSuccess({
                programs: { total: totalPrograms, active: activePrograms },
                cohorts: { total: totalCohorts, active: activeCohorts, upcoming: upcomingCohorts },
                students: {
                    total: totalStudents,
                    active: activeStudents,
                    invited: invitedStudents,
                    flagged: flaggedStudents,
                    dropped: droppedStudents,
                    completed: completedStudents,
                },
                mentors: { total: totalMentors, active: activeMentors },
                topCohorts: sortedTopCohorts,
                recentStudents: flatRecentStudents,
                enrollmentTrend,
            });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
