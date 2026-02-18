import prisma from '@/lib/prisma';
import { apiSuccess, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';

// GET /api/v1/notifications — Returns recent audit log entries formatted as notifications
export const GET = withAuth(
    async () => {
        try {
            const logs = await prisma.auditLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: 15,
                include: {
                    actor: {
                        select: { id: true, name: true, avatarUrl: true },
                    },
                },
            });

            const ACTION_MAP: Record<string, { type: string; label: string }> = {
                STUDENT_CREATED: { type: 'success', label: 'New Student Enrollment' },
                STUDENT_UPDATED: { type: 'info', label: 'Student Profile Updated' },
                STUDENT_DELETED: { type: 'warning', label: 'Student Removed' },
                MENTOR_CREATED: { type: 'success', label: 'New Mentor Added' },
                MENTOR_ASSIGNED: { type: 'success', label: 'Mentor Assigned' },
                MENTOR_UPDATED: { type: 'info', label: 'Mentor Profile Updated' },
                COHORT_CREATED: { type: 'success', label: 'New Cohort Created' },
                COHORT_UPDATED: { type: 'info', label: 'Cohort Updated' },
                SETTINGS_UPDATED: { type: 'info', label: 'Settings Updated' },
                COURSE_CREATED: { type: 'success', label: 'New Course Created' },
                COURSE_UPDATED: { type: 'info', label: 'Course Updated' },
                COMMUNICATION_SENT: { type: 'info', label: 'Message Sent' },
                SUBMISSION_GRADED: { type: 'success', label: 'Submission Graded' },
                USER_LOGIN: { type: 'info', label: 'User Login' },
            };

            const notifications = logs.map(log => {
                const mapped = ACTION_MAP[log.action] || { type: 'info', label: log.action.replace(/_/g, ' ') };
                return {
                    id: log.id,
                    type: mapped.type,
                    title: mapped.label,
                    description: `${log.entityType}${log.entityId ? ` (${log.entityId.slice(0, 8)}...)` : ''}`,
                    time: log.createdAt,
                    userName: log.actor?.name || 'System',
                    userAvatar: log.actor?.avatarUrl || null,
                };
            });

            return apiSuccess({ notifications });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN', 'INSTRUCTOR']
);
