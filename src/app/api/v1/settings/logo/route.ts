import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { logAudit } from '@/lib/audit';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

// POST /api/v1/settings/logo - Upload organization logo
export const POST = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            const formData = await req.formData();
            const file = formData.get('logo') as File | null;

            if (!file) {
                return apiError('No file provided', 400, 'VALIDATION_ERROR');
            }

            if (!ALLOWED_TYPES.includes(file.type)) {
                return apiError(
                    'Invalid file type. Allowed: PNG, JPG, WebP, SVG.',
                    400,
                    'VALIDATION_ERROR'
                );
            }

            if (file.size > MAX_SIZE) {
                return apiError('File too large. Maximum size is 2MB.', 400, 'VALIDATION_ERROR');
            }

            const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
            const filename = `logo-${Date.now()}.${ext}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            const filePath = path.join(uploadDir, filename);

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(filePath, buffer);

            const logoUrl = `/uploads/${filename}`;

            // Remove old logo file if it exists
            const settings = await prisma.settings.findFirst();
            if (settings?.logoUrl && settings.logoUrl.startsWith('/uploads/')) {
                const oldPath = path.join(process.cwd(), 'public', settings.logoUrl);
                try {
                    await unlink(oldPath);
                } catch {
                    // Old file may not exist
                }
            }

            // Update settings with new logo URL
            if (!settings) {
                return apiError('Settings not initialized', 404, 'NOT_FOUND');
            }

            const updated = await prisma.settings.update({
                where: { id: settings.id },
                data: { logoUrl },
            });

            await logAudit(user.id, 'LOGO_UPLOADED', 'Settings', settings.id);

            return apiSuccess({ logoUrl: updated.logoUrl });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);

// DELETE /api/v1/settings/logo - Remove organization logo
export const DELETE = withAuth(
    async (_req: NextRequest, _ctx, user) => {
        try {
            const settings = await prisma.settings.findFirst();
            if (!settings) {
                return apiError('Settings not initialized', 404, 'NOT_FOUND');
            }

            // Remove file from disk
            if (settings.logoUrl && settings.logoUrl.startsWith('/uploads/')) {
                const filePath = path.join(process.cwd(), 'public', settings.logoUrl);
                try {
                    await unlink(filePath);
                } catch {
                    // File may not exist
                }
            }

            await prisma.settings.update({
                where: { id: settings.id },
                data: { logoUrl: null },
            });

            await logAudit(user.id, 'LOGO_REMOVED', 'Settings', settings.id);

            return apiSuccess({ logoUrl: null });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
