import { NextRequest } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { withAuth } from '@/lib/middleware/rbac';
import { apiError, apiSuccess, handleApiError } from '@/lib/errors';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export const POST = withAuth(async (req: NextRequest) => {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return apiError('No image provided', 400, 'VALIDATION_ERROR');
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return apiError('Invalid file type. Allowed: PNG, JPG, WebP.', 400, 'VALIDATION_ERROR');
        }

        if (file.size > MAX_SIZE) {
            return apiError('Image too large. Maximum size is 2MB.', 400, 'VALIDATION_ERROR');
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
        const filename = `avatar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
        const filePath = path.join(uploadDir, filename);

        await mkdir(uploadDir, { recursive: true });

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        return apiSuccess({ avatarUrl: `/uploads/avatars/${filename}` }, 201);
    } catch (error) {
        return handleApiError(error);
    }
}, ['ADMIN', 'INSTRUCTOR', 'STUDENT']);
