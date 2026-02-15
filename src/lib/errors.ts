import { NextResponse } from 'next/server';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public code: string = 'ERROR'
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export function apiSuccess(data: unknown, status = 200) {
    return NextResponse.json({ success: true, data }, { status });
}

export function apiError(
    message: string,
    status = 400,
    code = 'BAD_REQUEST',
    details?: unknown
) {
    return NextResponse.json(
        { success: false, error: { code, message, details } },
        { status }
    );
}

export function handleApiError(error: unknown) {
    if (error instanceof AppError) {
        return apiError(error.message, error.statusCode, error.code);
    }
    console.error('Unhandled error:', error);
    return apiError('Internal server error', 500, 'INTERNAL_ERROR');
}
