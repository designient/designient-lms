import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/sessions/[id]/attendance - Get attendance for session
export const GET = withAuth(
    async (_req: NextRequest, ctx) => {
        try {
            const { id } = await ctx.params;

            const attendances = await prisma.attendance.findMany({
                where: { sessionId: id },
                include: {
                    student: {
                        select: { id: true, name: true, email: true },
                    },
                },
            });

            return apiSuccess({ attendances });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);

// POST /api/v1/sessions/[id]/attendance - Bulk mark attendance
export const POST = withAuth(
    async (req: NextRequest, ctx, user) => {
        try {
            const { id } = await ctx.params;
            const { records } = await req.json();

            if (!Array.isArray(records) || records.length === 0) {
                return apiError('records array is required', 400);
            }

            // Upsert each attendance record
            const operations = records.map((r: { studentId: string; status: string }) =>
                prisma.attendance.upsert({
                    where: {
                        sessionId_studentId: {
                            sessionId: id,
                            studentId: r.studentId,
                        },
                    },
                    update: {
                        status: r.status as 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED',
                        markedBy: user.id,
                    },
                    create: {
                        sessionId: id,
                        studentId: r.studentId,
                        status: r.status as 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED',
                        markedBy: user.id,
                    },
                })
            );

            await prisma.$transaction(operations);

            return apiSuccess({ message: `Marked attendance for ${records.length} students` });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['INSTRUCTOR', 'ADMIN']
);
