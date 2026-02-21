import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { studentProfileSchema, formatZodErrors } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { ensureStudentEnrollmentsForCohort } from '@/lib/cohort-curriculum';
import crypto from 'crypto';
import { sendInvitationEmail } from '@/lib/email';

// GET /api/v1/students - List all students
export const GET = withAuth(
    async (req: NextRequest) => {
        try {
            const { searchParams } = req.nextUrl;
            const page = Math.max(1, Number(searchParams.get('page') || '1'));
            const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '12')));
            const search = searchParams.get('search') || '';
            const status = searchParams.get('status');
            const cohortId = searchParams.get('cohortId');

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

            if (cohortId) {
                where.cohortId = cohortId;
            }

            const [students, total] = await Promise.all([
                prisma.studentProfile.findMany({
                    where,
                    include: {
                        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
                        cohort: { select: { id: true, name: true, status: true } },
                        mentor: { select: { id: true, name: true } }
                    },
                    orderBy: { user: { name: 'asc' } },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma.studentProfile.count({ where }),
            ]);

            // Transform to flat structure
            const flattened = students.map(s => ({
                id: s.id,
                userId: s.userId,
                name: s.user.name,
                email: s.user.email,
                avatarUrl: s.user.avatarUrl,
                phone: s.phone,
                status: s.status,
                cohortId: s.cohortId,
                cohortName: s.cohort?.name,
                mentorId: s.mentor?.id,
                mentorName: s.mentor?.name,
                enrollmentDate: s.enrollmentDate,
                whatsappOptIn: s.whatsappOptIn,
            }));

            return apiSuccess({
                students: flattened,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            });

        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN', 'INSTRUCTOR']
);

// POST /api/v1/students - Invite student
export const POST = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            const body = await req.json();
            // Expected body: { email, name, cohortId, phone, ...profile }

            const { email, name, ...profileData } = body;

            let targetUserId = body.userId;

            if (!targetUserId && email) {
                let targetUser = await prisma.user.findUnique({ where: { email } });
                if (!targetUser) {
                    const token = crypto.randomBytes(32).toString('hex');
                    const tokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

                    targetUser = await prisma.user.create({
                        data: {
                            email,
                            name: name || email.split('@')[0],
                            role: 'STUDENT',
                            passwordHash: 'PENDING_SETUP',
                            isActive: true,
                            emailVerified: false,
                            resetToken: token,
                            resetTokenExp: tokenExp,
                        }
                    });

                    // Send invitation email in background
                    sendInvitationEmail(email, token, 'student', targetUser.name).catch((err: unknown) =>
                        console.error('Failed to send invitation email:', err)
                    );
                }
                targetUserId = targetUser.id;
            }

            if (!targetUserId) {
                return apiError('User ID or Email is required', 400, 'MISSING_FIELD');
            }

            const parsed = studentProfileSchema.safeParse(profileData);
            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
            }

            const existingProfile = await prisma.studentProfile.findUnique({ where: { userId: targetUserId } });
            if (existingProfile) {
                return apiError('User is already a student', 409, 'PROFILE_EXISTS');
            }

            const student = await prisma.studentProfile.create({
                data: {
                    userId: targetUserId,
                    ...parsed.data
                },
                include: { user: true, cohort: true }
            });

            // Auto-enroll in the cohort syllabus (cohort courses + program-linked course).
            if (parsed.data.cohortId) {
                await ensureStudentEnrollmentsForCohort(targetUserId, parsed.data.cohortId);
            }

            await logAudit(user.id, 'STUDENT_INVITED', 'StudentProfile', student.id);

            return apiSuccess(student, 201);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN', 'INSTRUCTOR', 'ADMIN']
);
