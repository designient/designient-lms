import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { messageSchema, formatZodErrors } from '@/lib/validations';
import { logAudit } from '@/lib/audit';

// GET /api/v1/communications - List messages
export const GET = withAuth(
    async (req: NextRequest) => {
        try {
            const { searchParams } = req.nextUrl;
            const page = Math.max(1, Number(searchParams.get('page') || '1'));
            const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '12')));
            const channel = searchParams.get('channel');
            const status = searchParams.get('status');

            const where: Record<string, unknown> = {};

            if (channel) where.channel = channel;
            if (status) where.status = status;

            const [messages, total] = await Promise.all([
                prisma.message.findMany({
                    where,
                    include: {
                        sender: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma.message.count({ where }),
            ]);

            return apiSuccess({
                messages,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            });

        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN', 'INSTRUCTOR']
);

// POST /api/v1/communications - Send message
export const POST = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            const body = await req.json();
            const parsed = messageSchema.safeParse(body);

            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
            }

            const settings = await prisma.settings.findFirst({
                select: { securitySettings: true },
                orderBy: { createdAt: 'asc' },
            });
            const securitySettings = (settings?.securitySettings || {}) as Record<string, unknown>;
            const channelConfig = {
                EMAIL: securitySettings.emailEnabled !== undefined ? Boolean(securitySettings.emailEnabled) : true,
                WHATSAPP: securitySettings.whatsappEnabled !== undefined ? Boolean(securitySettings.whatsappEnabled) : false,
                SMS: securitySettings.smsEnabled !== undefined ? Boolean(securitySettings.smsEnabled) : false,
            };

            if (!channelConfig[parsed.data.channel]) {
                return apiError(
                    `${parsed.data.channel} notifications are currently disabled in Settings.`,
                    422,
                    'CHANNEL_DISABLED'
                );
            }

            // Logic to determine recipient count based on type
            // For now, we'll placeholder this or count if specific IDs are provided
            let recipientCount = 0;
            if (parsed.data.recipientIds) {
                recipientCount = parsed.data.recipientIds.length;
            } else if (parsed.data.recipientType === 'ALL_STUDENTS') {
                // Approximate count
                recipientCount = await prisma.studentProfile.count();
            }

            const message = await prisma.message.create({
                data: {
                    subject: parsed.data.subject,
                    body: parsed.data.body,
                    channel: parsed.data.channel,
                    recipientType: parsed.data.recipientType,
                    status: parsed.data.scheduledAt ? 'SCHEDULED' : 'SENT', // If scheduled, mark as scheduled
                    scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
                    sentAt: parsed.data.scheduledAt ? null : new Date(),
                    recipientCount,
                    senderId: user.id
                },
            });

            // Trigger actual sending logic here (e.g., add to queue)
            // if (!parsed.data.scheduledAt) { await sendEmail(...) }

            await logAudit(user.id, 'MESSAGE_SENT', 'Message', message.id);

            return apiSuccess(message, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN', 'INSTRUCTOR']
);
