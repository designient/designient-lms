import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Admin/instructor-only routes
const ADMIN_ROUTES = ['/dashboard', '/programs', '/cohorts', '/students', '/mentors', '/settings', '/analytics', '/communications'];

// Student-only routes
const STUDENT_ROUTES = ['/s/'];

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Allow API routes, static assets, uploads, and the root redirect
    if (
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/uploads/') ||
        pathname === '/'
    ) {
        return NextResponse.next();
    }

    const token = await getToken({ req, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET });
    const role = token?.role as string | undefined;

    // Login page: always accessible (post-login redirect handled client-side)
    if (pathname === '/login') {
        return NextResponse.next();
    }

    // Not authenticated — redirect to login
    if (!token) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Student trying to access admin routes
    if (ADMIN_ROUTES.some((route) => pathname.startsWith(route)) && role === 'STUDENT') {
        return NextResponse.redirect(new URL('/s/dashboard', req.url));
    }

    // Admin/Instructor trying to access student routes
    if (
        STUDENT_ROUTES.some((route) => pathname.startsWith(route)) &&
        (role === 'ADMIN' || role === 'INSTRUCTOR')
    ) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
