import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/me/profile — user profile with role-specific details
export const GET = withAuth(async (_req, _ctx, user) => {
    try {
        const profile = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                createdAt: true,
                studentProfile: {
                    include: {
                        cohort: {
                            select: { id: true, name: true, startDate: true, endDate: true },
                        },
                    },
                },
                mentorProfile: true,
            },
        });

        if (!profile) {
            return apiError('User not found', 404, 'NOT_FOUND');
        }

        return apiSuccess(profile);
    } catch (error) {
        return handleApiError(error);
    }
});

// PATCH /api/v1/me/profile — update student profile fields
export const PATCH = withAuth(async (req: NextRequest, _ctx, user) => {
    try {
        const body = await req.json();
        const { name, phone, whatsappOptIn } = body;

        // Update user name if provided
        if (name && typeof name === 'string' && name.trim()) {
            await prisma.user.update({
                where: { id: user.id },
                data: { name: name.trim() },
            });
        }

        // Update student profile fields if provided
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: user.id },
        });

        if (studentProfile) {
            const profileUpdate: Record<string, unknown> = {};
            if (phone !== undefined) profileUpdate.phone = phone || null;
            if (whatsappOptIn !== undefined) profileUpdate.whatsappOptIn = Boolean(whatsappOptIn);

            if (Object.keys(profileUpdate).length > 0) {
                await prisma.studentProfile.update({
                    where: { userId: user.id },
                    data: profileUpdate,
                });
            }
        }

        // Return updated profile
        const updated = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                createdAt: true,
                studentProfile: {
                    include: {
                        cohort: {
                            select: { id: true, name: true, startDate: true, endDate: true },
                        },
                    },
                },
            },
        });

        return apiSuccess(updated);
    } catch (error) {
        return handleApiError(error);
    }
});
