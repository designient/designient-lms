import type { AuthBrandCopy, AuthLinkItem, AuthScreenCopy } from '@/types/auth';

export const AUTH_BRAND_COPY: AuthBrandCopy = {
    eyebrow: 'Workspace Portal',
    headline: 'Run Your CohortOS Workspace',
    description: 'Operate programs, mentor workflows, and learner outcomes with confidence.',
    capabilities: [
        { label: 'Program Operations' },
        { label: 'Mentor Enablement' },
        { label: 'Student Progress' },
    ],
    trust: [
        { label: 'Encrypted Sessions' },
        { label: 'Role-Based Access' },
        { label: 'Audit Logging' },
    ],
};

export const AUTH_SCREEN_COPY: Record<'login' | 'forgotPassword' | 'resetPassword' | 'signup', AuthScreenCopy> = {
    login: {
        title: 'Sign in to Designient Workspace',
        subtitle: 'Access your cohorts, mentoring operations, and student progress in one place.',
    },
    forgotPassword: {
        title: 'Reset access',
        subtitle: 'Enter your work email and we\'ll send a secure reset link.',
    },
    resetPassword: {
        title: 'Set a new password',
        subtitle: 'Choose a strong password to secure your workspace account.',
    },
    signup: {
        title: 'Create account',
        subtitle: 'Set up your workspace profile to access your assigned programs and cohorts.',
    },
};

export const AUTH_LEGAL_LINKS: AuthLinkItem[] = [
    { label: 'Privacy Policy', href: 'https://designient.com/privacy-policy' },
    { label: 'Terms of Service', href: 'https://designient.com/terms-and-conditions' },
    { label: 'Support', href: 'https://designient.com/contact-us' },
];
