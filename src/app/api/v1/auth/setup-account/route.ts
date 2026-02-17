import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { z } from 'zod';

const setupSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = setupSchema.safeParse(body);

        if (!parsed.success) {
            return apiError('Validation failed', 400, 'VALIDATION_ERROR', parsed.error.format());
        }

        const { token, password } = parsed.data;

        // Find user with valid token
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExp: { gt: new Date() },
            },
        });

        if (!user) {
            return apiError('Invalid or expired token', 400, 'INVALID_TOKEN');
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                emailVerified: true,
                isActive: true,
                resetToken: null,
                resetTokenExp: null,
            },
        });

        return apiSuccess({ message: 'Account set up successfully. You can now login.' });

    } catch (error) {
        return handleApiError(error);
    }
}
