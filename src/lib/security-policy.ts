import prisma from '@/lib/prisma';

type SecuritySettings = {
    whatsappEnabled?: boolean;
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    pushEnabled?: boolean;
    minPasswordLength?: number;
    requireUppercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
    sessionTimeout?: string;
    maxLoginAttempts?: number;
    lockoutMinutes?: number;
};

export type ResolvedSecurityPolicy = {
    whatsappEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    minPasswordLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    sessionTimeout: '15m' | '30m' | '1h' | '4h' | '24h';
    maxLoginAttempts: number;
    lockoutMinutes: number;
};

export const DEFAULT_SECURITY_POLICY: ResolvedSecurityPolicy = {
    whatsappEnabled: false,
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    minPasswordLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    sessionTimeout: '24h',
    maxLoginAttempts: 5,
    lockoutMinutes: 15,
};

const SESSION_TIMEOUT_MS: Record<ResolvedSecurityPolicy['sessionTimeout'], number> = {
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
};

export function sessionTimeoutToMs(value: ResolvedSecurityPolicy['sessionTimeout']) {
    return SESSION_TIMEOUT_MS[value] ?? SESSION_TIMEOUT_MS['24h'];
}

export async function getSecurityPolicy(): Promise<ResolvedSecurityPolicy> {
    const settings = await prisma.settings.findFirst({
        select: { securitySettings: true },
        orderBy: { createdAt: 'asc' },
    });

    const raw = (settings?.securitySettings || {}) as SecuritySettings;
    const sessionTimeout = raw.sessionTimeout;
    const normalizedSessionTimeout: ResolvedSecurityPolicy['sessionTimeout'] =
        sessionTimeout === '15m' || sessionTimeout === '30m' || sessionTimeout === '1h' || sessionTimeout === '4h' || sessionTimeout === '24h'
            ? sessionTimeout
            : DEFAULT_SECURITY_POLICY.sessionTimeout;

    return {
        whatsappEnabled: raw.whatsappEnabled ?? DEFAULT_SECURITY_POLICY.whatsappEnabled,
        emailEnabled: raw.emailEnabled ?? DEFAULT_SECURITY_POLICY.emailEnabled,
        smsEnabled: raw.smsEnabled ?? DEFAULT_SECURITY_POLICY.smsEnabled,
        pushEnabled: raw.pushEnabled ?? DEFAULT_SECURITY_POLICY.pushEnabled,
        minPasswordLength: Math.min(32, Math.max(6, raw.minPasswordLength ?? DEFAULT_SECURITY_POLICY.minPasswordLength)),
        requireUppercase: raw.requireUppercase ?? DEFAULT_SECURITY_POLICY.requireUppercase,
        requireNumbers: raw.requireNumbers ?? DEFAULT_SECURITY_POLICY.requireNumbers,
        requireSpecialChars: raw.requireSpecialChars ?? DEFAULT_SECURITY_POLICY.requireSpecialChars,
        sessionTimeout: normalizedSessionTimeout,
        maxLoginAttempts: Math.min(10, Math.max(3, raw.maxLoginAttempts ?? DEFAULT_SECURITY_POLICY.maxLoginAttempts)),
        lockoutMinutes: Math.min(120, Math.max(5, raw.lockoutMinutes ?? DEFAULT_SECURITY_POLICY.lockoutMinutes)),
    };
}

export function validatePasswordWithPolicy(password: string, policy: ResolvedSecurityPolicy): string | null {
    if (password.length < policy.minPasswordLength) {
        return `Password must be at least ${policy.minPasswordLength} characters.`;
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter.';
    }

    if (policy.requireNumbers && !/[0-9]/.test(password)) {
        return 'Password must contain at least one number.';
    }

    if (policy.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
        return 'Password must contain at least one special character.';
    }

    return null;
}

export async function getLoginAttemptState(identifier: string) {
    const attempt = await prisma.loginAttempt.findUnique({ where: { identifier } });
    const now = new Date();

    if (!attempt || !attempt.lockedUntil || attempt.lockedUntil <= now) {
        return { isLocked: false, attempt };
    }

    return { isLocked: true, attempt };
}

export async function registerFailedLoginAttempt(
    identifier: string,
    maxLoginAttempts: number,
    lockoutMinutes: number
) {
    const existing = await prisma.loginAttempt.findUnique({ where: { identifier } });
    const attempts = (existing?.attempts || 0) + 1;
    const shouldLock = attempts >= maxLoginAttempts;

    await prisma.loginAttempt.upsert({
        where: { identifier },
        create: {
            identifier,
            attempts,
            lockedUntil: shouldLock ? new Date(Date.now() + lockoutMinutes * 60 * 1000) : null,
            lastAttemptAt: new Date(),
        },
        update: {
            attempts,
            lockedUntil: shouldLock ? new Date(Date.now() + lockoutMinutes * 60 * 1000) : null,
            lastAttemptAt: new Date(),
        },
    });
}

export async function clearLoginAttempts(identifier: string) {
    await prisma.loginAttempt.deleteMany({ where: { identifier } });
}
