import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const page = Math.max(1, Number(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')));

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                include: {
                    actor: { select: { id: true, name: true, role: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.auditLog.count(),
        ]);

        const flattened = logs.map(log => ({
            id: log.id,
            userId: log.actorId || '',
            userName: log.actor?.name || 'System',
            userRole: log.actor?.role?.toLowerCase().replace('_', ' ') || 'system',
            action: log.action,
            resource: log.entityType,
            resourceId: log.entityId || undefined,
            details: (log.metadata as Record<string, unknown>)?.details as string || undefined,
            ipAddress: '',
            timestamp: log.createdAt.toISOString(),
            status: 'success' as const,
        }));

        return apiSuccess({
            logs: flattened,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
