import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { signupSchema, formatZodErrors } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { rateLimit } from '@/lib/middleware/rateLimit';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
    try {
        const rateLimited = rateLimit(req);
        if (rateLimited) return rateLimited;

        const body = await req.json();
        const parsed = signupSchema.safeParse(body);
        if (!parsed.success) {
            return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
        }

        const { name, email, password } = parsed.data;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return apiError('Email already registered', 409, 'EMAIL_EXISTS');
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const verifyToken = uuidv4();

        const user = await prisma.user.create({
            data: { name, email, passwordHash, verifyToken },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        });

        // Send verification email (non-blocking)
        sendVerificationEmail(email, verifyToken).catch(console.error);

        await logAudit(user.id, 'SIGNUP', 'User', user.id);

        return apiSuccess(user, 201);
    } catch (error) {
        return handleApiError(error);
    }
}
