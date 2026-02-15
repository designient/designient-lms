import prisma from './prisma';

export async function logAudit(
    actorId: string | null,
    action: string,
    entityType: string,
    entityId?: string | null,
    metadata?: Record<string, unknown>
) {
    try {
        await prisma.auditLog.create({
            data: {
                actorId,
                action,
                entityType,
                entityId: entityId ?? null,
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
            },
        });
    } catch (err) {
        console.error('Audit log failed:', err);
    }
}
