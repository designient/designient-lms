import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { settingsSchema, formatZodErrors } from '@/lib/validations';
import { logAudit } from '@/lib/audit';

// GET /api/v1/settings - Get organization settings
export const GET = withAuth(
    async () => {
        try {
            // Singleton pattern: get the first settings record
            let settings = await prisma.settings.findFirst();

            if (!settings) {
                // Initialize default settings if none exist
                settings = await prisma.settings.create({
                    data: {
                        orgName: 'My Organization',
                        orgSlug: 'my-org',
                        catalogSettings: {
                            mentorSpecialties: [
                                { value: 'design-systems', label: 'Design Systems' },
                                { value: 'product-design', label: 'Product Design' },
                                { value: 'ux-strategy', label: 'UX Strategy' },
                                { value: 'ui-design', label: 'UI Design' },
                                { value: 'ux-research', label: 'UX Research' },
                                { value: 'interaction-design', label: 'Interaction Design' },
                                { value: 'career-development', label: 'Career Development' },
                            ],
                        },
                    }
                });
            }

            return apiSuccess(settings);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);

// PUT /api/v1/settings - Update settings
export const PUT = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            const body = await req.json();
            const parsed = settingsSchema.safeParse(body);

            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
            }

            let settings = await prisma.settings.findFirst();
            if (!settings) {
                return apiError('Settings not initialized', 404, 'NOT_FOUND');
            }

            const updatedSettings = await prisma.settings.update({
                where: { id: settings.id },
                data: parsed.data,
            });

            await logAudit(user.id, 'SETTINGS_UPDATED', 'Settings', settings.id);

            return apiSuccess(updatedSettings);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
