import { apiSuccess, handleApiError } from '@/lib/errors';
import { logAudit } from '@/lib/audit';
import { auth } from '@/lib/auth';

export async function POST() {
    try {
        const session = await auth();
        if (session?.user) {
            await logAudit(session.user.id, 'LOGOUT', 'User', session.user.id);
        }
        return apiSuccess({ message: 'Logged out successfully' });
    } catch (error) {
        return handleApiError(error);
    }
}
