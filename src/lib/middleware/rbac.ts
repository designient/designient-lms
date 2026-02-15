import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { apiError } from '@/lib/errors';

type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

interface AuthedUser {
    id: string;
    name: string;
    email: string;
    role: Role;
    isActive: boolean;
}

// Wraps an API route handler with authentication + role-based access control
export function withAuth(
    handler: (
        req: NextRequest,
        context: { params: Promise<Record<string, string>> },
        user: AuthedUser
    ) => Promise<Response>,
    allowedRoles?: Role[]
) {
    return async (
        req: NextRequest,
        context: { params: Promise<Record<string, string>> }
    ) => {
        const session = await auth();
        if (!session?.user) {
            return apiError('Authentication required', 401, 'UNAUTHORIZED');
        }

        const user = session.user as AuthedUser;

        if (!user.isActive) {
            return apiError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
        }

        if (allowedRoles && !allowedRoles.includes(user.role)) {
            return apiError('Insufficient permissions', 403, 'FORBIDDEN');
        }

        return handler(req, context, user);
    };
}
