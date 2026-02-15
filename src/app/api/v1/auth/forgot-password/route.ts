import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { forgotPasswordSchema, formatZodErrors } from '@/lib/validations';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimit } from '@/lib/middleware/rateLimit';

export async function POST(req: NextRequest) {
    try {
        const rateLimited = rateLimit(req);
        if (rateLimited) return rateLimited;

        const body = await req.json();
        const parsed = forgotPasswordSchema.safeParse(body);
        if (!parsed.success) {
            return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
        }

        const { email } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });

        // Always return success to prevent email enumeration
        if (!user) {
            return apiSuccess({ message: 'If the email exists, a reset link has been sent.' });
        }

        const resetToken = uuidv4();
        const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken, resetTokenExp },
        });

        sendPasswordResetEmail(email, resetToken).catch(console.error);

        return apiSuccess({ message: 'If the email exists, a reset link has been sent.' });
    } catch (error) {
        return handleApiError(error);
    }
}
