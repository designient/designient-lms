import prisma from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';

// GET /api/v1/settings/public - safe organization branding fields only
export async function GET() {
    try {
        const settings = await prisma.settings.findFirst({
            select: {
                orgName: true,
                orgSlug: true,
                logoUrl: true,
                primaryColor: true,
                supportEmail: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        if (!settings) {
            return apiSuccess({
                orgName: 'My Organization',
                orgSlug: 'my-org',
                logoUrl: null,
                primaryColor: null,
                supportEmail: null,
            });
        }

        return apiSuccess(settings);
    } catch (error) {
        return handleApiError(error);
    }
}
