'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthField } from '@/components/auth/AuthField';
import { AUTH_SCREEN_COPY } from '@/content/auth';

function ResetPasswordForm() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    const token = searchParams.get('token') || '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/reset-password', { token, password });
            if (!res.success) {
                throw new Error(res.error?.message || 'Reset failed');
            }
            toast({
                title: 'Password reset',
                description: 'Your password has been updated. Redirecting to sign in...',
                variant: 'success',
            });
            setTimeout(() => router.push('/login'), 1400);
        } catch (error) {
            toast({
                title: 'Reset failed',
                description: error instanceof Error ? error.message : 'Something went wrong',
                variant: 'error',
            });
        }
        setLoading(false);
    };

    if (!token) {
        return (
            <div className="auth-error-banner" role="alert">
                <span>Invalid or missing reset token.</span>
                <Link href="/forgot-password" className="auth-inline-link ml-2">
                    Request a new one
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <AuthField
                id="password"
                label="New Password"
                type="password"
                icon={Lock}
                placeholder="Choose a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
            />

            <button type="submit" className="auth-submit-button" disabled={loading}>
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Resetting...
                    </>
                ) : (
                    'Reset Password'
                )}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <AuthShell>
            <div className="w-full max-w-[460px] space-y-4">
                <AuthFormCard
                    title={AUTH_SCREEN_COPY.resetPassword.title}
                    subtitle={AUTH_SCREEN_COPY.resetPassword.subtitle}
                >
                    <Suspense fallback={<div className="auth-loading-copy">Loading reset form...</div>}>
                        <ResetPasswordForm />
                    </Suspense>
                </AuthFormCard>

                <div className="auth-secondary-actions">
                    <Link href="/login" className="auth-inline-link">
                        Back to Sign In
                    </Link>
                </div>
            </div>
        </AuthShell>
    );
}
