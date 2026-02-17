import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/me/schedule — student's upcoming classes
export const GET = withAuth(async (req: NextRequest, _ctx, user) => {
    try {
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: user.id },
            select: { cohortId: true },
        });

        if (!studentProfile?.cohortId) {
            return apiSuccess({ sessions: [] });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sessions = await prisma.classSession.findMany({
            where: {
                cohortId: studentProfile.cohortId,
                scheduledAt: {
                    gte: today, // Show today's and future sessions
                },
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: {
                scheduledAt: 'asc',
            },
        });

        return apiSuccess({ sessions });
    } catch (error) {
        return handleApiError(error);
    }
});
