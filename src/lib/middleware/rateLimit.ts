import { NextRequest } from 'next/server';
import { apiError } from '@/lib/errors';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 20; // max requests per window

export function rateLimit(req: NextRequest): Response | null {
    const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown';

    const key = `${ip}:${req.nextUrl.pathname}`;
    const now = Date.now();

    const entry = rateLimitMap.get(key);
    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + WINDOW_MS });
        return null;
    }

    entry.count++;
    if (entry.count > MAX_REQUESTS) {
        return apiError('Too many requests, please try again later', 429, 'RATE_LIMITED') as Response;
    }

    return null;
}
