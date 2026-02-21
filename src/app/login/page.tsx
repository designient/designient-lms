'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { AuthShell } from '@/components/auth/AuthShell';
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
        <AuthShell showStatus contentClassName="auth-content-wrap-login">
            <div className={`auth-login-layout transition-opacity ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                <section className="auth-login-panel auth-fade-in" style={{ animationDelay: '0.12s' }}>
                    <header className="auth-login-header">
                        <h1 className="auth-form-title auth-form-title-login">{AUTH_SCREEN_COPY.login.title}</h1>
                        <p className="auth-form-subtitle auth-login-subtitle">{AUTH_SCREEN_COPY.login.subtitle}</p>
                    </header>

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
                                        <img
                                            src="/uploads/Google__G__logo.svg"
                                            alt=""
                                            aria-hidden="true"
                                            className="h-4 w-4 object-contain"
                                        />
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

                    <form onSubmit={handleSubmit} className="space-y-4 auth-login-form">
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
                </section>

                <div className="auth-login-meta">
                    <p className="auth-support-note">Students, mentors, and administrators sign in here.</p>
                    <div className="auth-security-row">
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Encrypted session and role-scoped access controls</span>
                    </div>
                </div>

                <div className="auth-trusted-partners" aria-label="Trusted certified partner">
                    <p className="auth-trusted-title">Trusted certified partner</p>
                    <div className="auth-trusted-logos">
                        <a
                            className="auth-partner-badge"
                            title="Adobe"
                            aria-label="Adobe"
                            href="https://www.adobe.com/in/"
                            target="_blank"
                            rel="noreferrer noopener"
                        >
                            <img
                                src="/uploads/adobe-logo.svg"
                                alt="Adobe logo"
                                className="auth-partner-logo auth-partner-logo-img"
                                loading="lazy"
                                decoding="async"
                            />
                        </a>
                    </div>
                </div>
            </div>
        </AuthShell>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <AuthShell showStatus contentClassName="auth-content-wrap-login">
                    <div className="auth-login-layout">
                        <section className="auth-login-panel auth-fade-in" style={{ animationDelay: '0.12s' }}>
                            <header className="auth-login-header">
                                <h1 className="auth-form-title auth-form-title-login">{AUTH_SCREEN_COPY.login.title}</h1>
                                <p className="auth-form-subtitle auth-login-subtitle">{AUTH_SCREEN_COPY.login.subtitle}</p>
                            </header>
                            <div className="auth-loading-copy">Loading sign-in options...</div>
                        </section>
                    </div>
                </AuthShell>
            }
        >
            <LoginPageContent />
        </Suspense>
    );
}
