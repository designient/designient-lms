'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthField } from '@/components/auth/AuthField';
import { AUTH_SCREEN_COPY } from '@/content/auth';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/forgot-password', { email });
            if (!res.success) {
                throw new Error(res.error?.message || 'Unable to send reset link');
            }
            setSent(true);
        } catch (error) {
            toast({
                title: 'Request failed',
                description: error instanceof Error ? error.message : 'Something went wrong',
                variant: 'error',
            });
        }
        setLoading(false);
    };

    return (
        <AuthShell>
            <div className="w-full max-w-[460px] space-y-4">
                <AuthFormCard
                    title={AUTH_SCREEN_COPY.forgotPassword.title}
                    subtitle={AUTH_SCREEN_COPY.forgotPassword.subtitle}
                >
                    {sent ? (
                        <div className="auth-success-panel" role="status">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                            <div>
                                <p className="auth-success-title">Check your email</p>
                                <p className="auth-success-copy">
                                    If an account exists for this email, a secure reset link has been sent.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <AuthField
                                id="email"
                                label="Work Email"
                                type="email"
                                icon={Mail}
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />

                            <button type="submit" className="auth-submit-button" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Sending link...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                        </form>
                    )}
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
