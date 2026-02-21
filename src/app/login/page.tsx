'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthField } from '@/components/auth/AuthField';
import { AUTH_SCREEN_COPY } from '@/content/auth';

const GOOGLE_SSO_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_SSO_ENABLED === 'true';
const IS_DEV = process.env.NODE_ENV !== 'production';

function getOAuthErrorMessage(errorCode: string | null) {
    if (!errorCode) return null;
    if (errorCode === 'AccessDenied') {
        return 'Your account must be invited by an admin before you can use Google sign-in.';
    }
    if (errorCode === 'OAuthAccountNotLinked') {
        return 'This Google account is not linked to an invited workspace user.';
    }
    return 'Unable to sign in with Google right now. Please try credentials login.';
}

function LoginPageContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);
    const [googleProviderAvailable, setGoogleProviderAvailable] = useState(false);
    const [providersLoaded, setProvidersLoaded] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        let isMounted = true;
        async function loadProviders() {
            try {
                const res = await fetch('/api/auth/providers');
                if (!res.ok) throw new Error('Failed to load providers');
                const providers = await res.json() as Record<string, unknown>;
                if (isMounted) {
                    setGoogleProviderAvailable(Boolean(providers?.google));
                }
            } catch {
                if (isMounted) {
                    setGoogleProviderAvailable(false);
                }
            } finally {
                if (isMounted) {
                    setProvidersLoaded(true);
                }
            }
        }

        if (GOOGLE_SSO_ENABLED) {
            loadProviders();
        } else {
            setProvidersLoaded(true);
            setGoogleProviderAvailable(false);
        }

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const oauthMessage = getOAuthErrorMessage(searchParams.get('error'));
        if (oauthMessage) {
            setError(oauthMessage);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError('Invalid email or password. Please try again.');
                setLoading(false);
                return;
            }

            const me = await fetch('/api/v1/auth/me');
            const data = await me.json();
            const role = data?.data?.role;
            const roleName = role === 'ADMIN' ? 'Admin' : role === 'INSTRUCTOR' ? 'Mentor' : 'Student';

            toast({
                title: 'Signed in',
                description: `Welcome back, ${roleName}.`,
                variant: 'success',
            });

            if (role === 'ADMIN') {
                router.push('/dashboard');
            } else if (role === 'INSTRUCTOR') {
                router.push('/m/dashboard');
            } else {
                router.push('/s/dashboard');
            }
            router.refresh();
        } catch {
            setError('Something went wrong. Please try again.');
        }

        setLoading(false);
    };

    const handleGoogleSignIn = async () => {
        try {
            setError('');
            setGoogleLoading(true);
            await signIn('google', { callbackUrl: '/dashboard' });
        } catch {
            setError('Unable to start Google sign-in. Please try again.');
            setGoogleLoading(false);
        }
    };

    const showGoogleSignIn = GOOGLE_SSO_ENABLED && googleProviderAvailable;
    const shouldShowGoogleConfigHint = GOOGLE_SSO_ENABLED && providersLoaded && !googleProviderAvailable && IS_DEV;

    return (
        <AuthShell showStatus>
            <div className={`w-full max-w-[460px] space-y-4 transition-opacity ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                <AuthFormCard
                    title={AUTH_SCREEN_COPY.login.title}
                    subtitle={AUTH_SCREEN_COPY.login.subtitle}
                    titleClassName="auth-form-title-login"
                    className="auth-form-card-login"
                >
                    {error ? (
                        <div className="auth-error-banner" role="alert">
                            <AlertCircle className="h-4 w-4" aria-hidden="true" />
                            <span>{error}</span>
                        </div>
                    ) : null}

                    {showGoogleSignIn ? (
                        <>
                            <button type="button" onClick={handleGoogleSignIn} disabled={googleLoading} className="auth-sso-button">
                                {googleLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Connecting Google...
                                    </>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                                            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 2.9 14.7 2 12 2 6.9 2 2.8 6.2 2.8 11.3S6.9 20.7 12 20.7c6.9 0 9.1-4.9 9.1-7.4 0-.5 0-.8-.1-1.1H12z" />
                                        </svg>
                                        Continue with Google
                                    </>
                                )}
                            </button>
                            <div className="auth-divider" role="separator">
                                <span>or sign in with email</span>
                            </div>
                        </>
                    ) : null}

                    {shouldShowGoogleConfigHint ? (
                        <div className="auth-debug-hint" role="note">
                            Google SSO toggle is enabled, but the Google provider is not available. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
                        </div>
                    ) : null}

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                        />

                        <AuthField
                            id="password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            icon={Lock}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                            trailing={
                                <button
                                    type="button"
                                    className="auth-input-action"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            }
                        />

                        <div className="flex items-center justify-end">
                            <Link href="/forgot-password" className="auth-inline-link">
                                Forgot password?
                            </Link>
                        </div>

                        <button type="submit" disabled={loading} className="auth-submit-button">
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>
                </AuthFormCard>

                <p className="auth-support-note">Students, mentors, and administrators sign in here.</p>
                <div className="auth-security-row">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Encrypted session and role-scoped access controls</span>
                </div>
            </div>
        </AuthShell>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <AuthShell showStatus>
                    <div className="w-full max-w-[460px] space-y-4">
                        <AuthFormCard
                            title={AUTH_SCREEN_COPY.login.title}
                            subtitle={AUTH_SCREEN_COPY.login.subtitle}
                            titleClassName="auth-form-title-login"
                            className="auth-form-card-login"
                        >
                            <div className="auth-loading-copy">Loading sign-in options...</div>
                        </AuthFormCard>
                    </div>
                </AuthShell>
            }
        >
            <LoginPageContent />
        </Suspense>
    );
}
