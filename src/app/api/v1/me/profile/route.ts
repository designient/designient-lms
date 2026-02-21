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
                emailNotifications: true,
                pushNotifications: true,
                createdAt: true,
                studentProfile: {
                    include: {
                        cohort: {
                            select: {
                                id: true,
                                name: true,
                                startDate: true,
                                endDate: true,
                                program: { select: { name: true } },
                            },
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

// PATCH /api/v1/me/profile — update profile fields (student or mentor)
export const PATCH = withAuth(async (req: NextRequest, _ctx, user) => {
    try {
        const body = await req.json();
        const { name, phone, whatsappOptIn, bio, specialization, avatarUrl, emailNotifications, pushNotifications } = body;

        // Update user name if provided
        const userUpdate: Record<string, unknown> = {};
        if (name && typeof name === 'string' && name.trim()) {
            userUpdate.name = name.trim();
        }
        if (avatarUrl !== undefined) {
            if (avatarUrl === null || avatarUrl === '') {
                userUpdate.avatarUrl = null;
            } else if (typeof avatarUrl === 'string') {
                userUpdate.avatarUrl = avatarUrl;
            } else {
                return apiError('Invalid avatarUrl', 422, 'VALIDATION_ERROR');
            }
        }
        if (emailNotifications !== undefined) {
            if (typeof emailNotifications !== 'boolean') {
                return apiError('Invalid emailNotifications', 422, 'VALIDATION_ERROR');
            }
            userUpdate.emailNotifications = emailNotifications;
        }
        if (pushNotifications !== undefined) {
            if (typeof pushNotifications !== 'boolean') {
                return apiError('Invalid pushNotifications', 422, 'VALIDATION_ERROR');
            }
            userUpdate.pushNotifications = pushNotifications;
        }
        if (Object.keys(userUpdate).length > 0) {
            await prisma.user.update({
                where: { id: user.id },
                data: userUpdate,
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

        // Update mentor profile fields if provided
        const mentorProfile = await prisma.mentorProfile.findUnique({
            where: { userId: user.id },
        });

        if (mentorProfile) {
            const mentorUpdate: Record<string, unknown> = {};
            if (bio !== undefined) mentorUpdate.bio = bio || null;
            if (specialization !== undefined) mentorUpdate.specialization = specialization || null;

            if (Object.keys(mentorUpdate).length > 0) {
                await prisma.mentorProfile.update({
                    where: { userId: user.id },
                    data: mentorUpdate,
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
                emailNotifications: true,
                pushNotifications: true,
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

        return apiSuccess(updated);
    } catch (error) {
        return handleApiError(error);
    }
});
