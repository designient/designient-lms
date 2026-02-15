import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { redirect } from 'next/navigation';

export async function GET(req: NextRequest) {
    try {
        const token = req.nextUrl.searchParams.get('token');
        if (!token) {
            return redirect('/login?error=missing-token');
        }

        const user = await prisma.user.findFirst({
            where: { verifyToken: token },
        });

        if (!user) {
            return redirect('/login?error=invalid-token');
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: true, verifyToken: null },
        });

        return apiSuccess({ message: 'Email verified successfully' });
    } catch (error) {
        return handleApiError(error);
    }
}
