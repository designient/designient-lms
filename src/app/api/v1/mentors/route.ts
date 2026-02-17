import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { mentorProfileSchema, formatZodErrors } from '@/lib/validations';
import { logAudit } from '@/lib/audit';

// GET /api/v1/mentors - List all mentors
export const GET = withAuth(
    async (req: NextRequest) => {
        try {
            const { searchParams } = req.nextUrl;
            const page = Math.max(1, Number(searchParams.get('page') || '1'));
            const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '12')));
            const search = searchParams.get('search') || '';
            const status = searchParams.get('status');

            const where: Record<string, unknown> = {};

            if (search) {
                where.user = {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                    ]
                };
            }

            if (status) {
                where.status = status;
            }

            const [mentors, total] = await Promise.all([
                prisma.mentorProfile.findMany({
                    where,
                    include: {
                        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
                        _count: { select: { cohorts: true } }
                    },
                    orderBy: { user: { name: 'asc' } },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma.mentorProfile.count({ where }),
            ]);

            // Transform to flat structure if needed by frontend, or keep as nested
            const flattened = mentors.map(m => ({
                id: m.id,
                userId: m.userId,
                name: m.user.name,
                email: m.user.email,
                avatarUrl: m.user.avatarUrl,
                specialization: m.specialization,
                status: m.status,
                cohortCount: m._count.cohorts,
                maxCohorts: m.maxCohorts,
                rating: m.rating,
            }));

            return apiSuccess({
                mentors: flattened,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            });

        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN', 'INSTRUCTOR']
);

// POST /api/v1/mentors - Create/Invite new mentor
export const POST = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            const body = await req.json();
            const { email, name, ...profileData } = body;

            let targetUserId = body.userId;

            if (!targetUserId && email) {
                // Check if user exists
                let targetUser = await prisma.user.findUnique({ where: { email } });
                if (!targetUser) {
                    const crypto = require('crypto');
                    const { sendInvitationEmail } = require('@/lib/email');

                    const token = crypto.randomBytes(32).toString('hex');
                    const tokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

                    targetUser = await prisma.user.create({
                        data: {
                            email,
                            name: name || email.split('@')[0],
                            role: 'INSTRUCTOR',
                            passwordHash: 'PENDING_SETUP',
                            isActive: true,
                            emailVerified: false,
                            resetToken: token,
                            resetTokenExp: tokenExp,
                        }
                    });

                    // Send invitation email
                    sendInvitationEmail(email, token, 'mentor', targetUser.name).catch((err: any) =>
                        console.error('Failed to send mentor invitation:', err)
                    );
                }
                targetUserId = targetUser.id;
            }

            if (!targetUserId) {
                return apiError('User ID or Email is required', 400, 'MISSING_FIELD');
            }

            const parsed = mentorProfileSchema.safeParse(profileData);
            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
            }

            // Check if profile exists
            const existingProfile = await prisma.mentorProfile.findUnique({ where: { userId: targetUserId } });
            if (existingProfile) {
                return apiError('User is already a mentor', 409, 'PROFILE_EXISTS');
            }

            const mentor = await prisma.mentorProfile.create({
                data: {
                    userId: targetUserId,
                    ...parsed.data
                },
                include: { user: true }
            });

            // Ensure user role is updated if needed
            await prisma.user.update({
                where: { id: targetUserId },
                data: { role: 'INSTRUCTOR' }
            });

            await logAudit(user.id, 'MENTOR_CREATED', 'MentorProfile', mentor.id);

            return apiSuccess(mentor, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
