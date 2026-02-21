import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const ADMIN_ROUTES = ['/dashboard', '/programs', '/cohorts', '/students', '/mentors', '/settings', '/analytics', '/communications'];

const STUDENT_ROUTES = ['/s/'];

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password', '/auth/setup-account'];

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/uploads/') ||
        pathname === '/'
    ) {
        return NextResponse.next();
    }

    if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    const token = await getToken({
        req,
        secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === 'production',
    });
    const role = token?.role as string | undefined;
    const rawSessionExpiresAt = token?.sessionExpiresAt;
    const sessionExpiresAt =
        typeof rawSessionExpiresAt === 'number'
            ? rawSessionExpiresAt
            : typeof rawSessionExpiresAt === 'string'
                ? Number(rawSessionExpiresAt)
                : null;

    if (!token) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (!role) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (sessionExpiresAt && !Number.isNaN(sessionExpiresAt) && Date.now() > sessionExpiresAt) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (
        (ADMIN_ROUTES.some((route) => pathname.startsWith(route)) || pathname.startsWith('/m/')) &&
        role === 'STUDENT'
    ) {
        return NextResponse.redirect(new URL('/s/dashboard', req.url));
    }

    if (STUDENT_ROUTES.some((route) => pathname.startsWith(route)) && role === 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (STUDENT_ROUTES.some((route) => pathname.startsWith(route)) && role === 'INSTRUCTOR') {
        return NextResponse.redirect(new URL('/m/dashboard', req.url));
    }

    if (ADMIN_ROUTES.some((route) => pathname.startsWith(route)) && role === 'INSTRUCTOR') {
        return NextResponse.redirect(new URL('/m/dashboard', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
