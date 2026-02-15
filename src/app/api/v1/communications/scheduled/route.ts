import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';

// GET /api/v1/communications/scheduled - List scheduled messages
export async function GET(req: NextRequest) {
    try {
        const messages = await prisma.message.findMany({
            where: { status: 'SCHEDULED' },
            include: { sender: { select: { name: true } } },
            orderBy: { scheduledAt: 'asc' },
        });

        return apiSuccess({ messages });
    } catch (error) {
        return handleApiError(error);
    }
}
