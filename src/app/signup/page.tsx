'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Loader2, Lock, Mail, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthField } from '@/components/auth/AuthField';
import { AUTH_SCREEN_COPY } from '@/content/auth';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const res = await api.post('/auth/signup', { name, email, password });
            if (!res.success) {
                const details = res.error?.details as { field: string; message: string }[] | undefined;
                if (Array.isArray(details)) {
                    const nextErrors: Record<string, string> = {};
                    details.forEach((detail) => {
                        nextErrors[detail.field] = detail.message;
                    });
                    setErrors(nextErrors);
                } else {
                    throw new Error(res.error?.message || 'Signup failed');
                }
            } else {
                toast({
                    title: 'Account created',
                    description: 'Your profile is ready. Continue to sign in.',
                    variant: 'success',
                });
                setTimeout(() => router.push('/login'), 1200);
            }
        } catch (error) {
            toast({
                title: 'Signup failed',
                description: error instanceof Error ? error.message : 'Something went wrong',
                variant: 'error',
            });
        }

        setLoading(false);
    };

    return (
        <AuthShell>
            <div className="w-full max-w-[460px] space-y-4">
                <AuthFormCard title={AUTH_SCREEN_COPY.signup.title} subtitle={AUTH_SCREEN_COPY.signup.subtitle}>
                    <div className="auth-notice-banner" role="note">
                        <p>Invite-first access is recommended. If your organization invited you, use the setup link from email.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <AuthField
                            id="name"
                            label="Full Name"
                            type="text"
                            icon={User}
                            placeholder="Your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete="name"
                            required
                            hint={errors.name}
                        />

                        <AuthField
                            id="email"
                            label="Email"
                            type="email"
                            icon={Mail}
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                            hint={errors.email}
                        />

                        <AuthField
                            id="password"
                            label="Password"
                            type="password"
                            icon={Lock}
                            placeholder="Minimum 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                            minLength={8}
                            hint={errors.password}
                        />

                        <button type="submit" disabled={loading} className="auth-submit-button">
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>
                </AuthFormCard>

                <div className="auth-secondary-actions">
                    <span className="auth-secondary-copy">Already have access?</span>
                    <Link href="/login" className="auth-inline-link">
                        Sign In
                    </Link>
                </div>
            </div>
        </AuthShell>
    );
}
