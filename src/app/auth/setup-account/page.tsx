'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, ArrowRight, Loader2, ShieldCheck, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

function SetupAccountContent() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const token = searchParams.get('token');

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing setup token.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/v1/auth/setup-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to set up account');
            }

            setSuccess(true);
            toast({
                title: 'Account Set Up',
                description: 'Your password has been set. Redirecting to login...',
                variant: 'success',
            });

            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 text-center login-stagger-1">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">All Set!</h2>
                <p className="text-muted-foreground">Your account has been successfully set up.</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirecting to login...
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full max-w-[420px] space-y-7 ${mounted ? '' : 'opacity-0'}`}>
            <div className="flex flex-col items-center mb-4 login-stagger-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="https://cdn.magicpatterns.com/uploads/jGmmhXeUn6N54eHSNgjaoE/designient-logo.svg"
                    alt="Designient"
                    className="h-8 mb-2"
                />
                <p className="text-[11px] text-muted-foreground/60 uppercase tracking-widest">
                    Account Setup
                </p>
            </div>

            <div className="space-y-2 login-stagger-1 text-center sm:text-left">
                <h1 className="text-2xl lg:text-[1.75rem] font-bold tracking-tight text-foreground">
                    Set your password
                </h1>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                    Choose a secure password to access your workspace.
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/15 text-[13px] text-red-600 dark:text-red-400"
                    style={{ animation: 'login-fade-up 0.3s ease-out' }}
                >
                    <span className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" style={{ animation: 'login-pulse-ring 2s infinite' }} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5 login-stagger-2">
                    <label htmlFor="password" className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">
                        New Password
                    </label>
                    <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-muted-foreground/40 group-focus-within:text-primary/60 transition-colors pointer-events-none" />
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            className="flex h-11 w-full rounded-xl border border-border/50 bg-card/50 pl-10 pr-11 text-[13px] transition-all duration-200 placeholder:text-muted-foreground/30 hover:border-border focus:border-primary/40 focus:outline-none focus:ring-[3px] focus:ring-primary/8 focus:bg-card"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground/35 hover:text-muted-foreground/70 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="space-y-1.5 login-stagger-3">
                    <label htmlFor="confirmPassword" className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">
                        Confirm Password
                    </label>
                    <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-muted-foreground/40 group-focus-within:text-primary/60 transition-colors pointer-events-none" />
                        <input
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            className="flex h-11 w-full rounded-xl border border-border/50 bg-card/50 pl-10 pr-11 text-[13px] transition-all duration-200 placeholder:text-muted-foreground/30 hover:border-border focus:border-primary/40 focus:outline-none focus:ring-[3px] focus:ring-primary/8 focus:bg-card"
                        />
                    </div>
                </div>

                <div className="login-stagger-5 pt-1">
                    <button
                        type="submit"
                        disabled={loading || !token}
                        className="relative group inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-[13px] shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all duration-200"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Setting password...
                            </>
                        ) : (
                            <>
                                Set Password & Login
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </form>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/40 login-stagger-6">
                <ShieldCheck className="h-3 w-3" />
                <span>Secure setup &bull; Encrypted</span>
            </div>
        </div>
    );
}

export default function SetupAccountPage() {
    return (
        <div className="min-h-screen flex font-sans bg-background">
            <style>{`
            @keyframes login-float-1 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -40px) scale(1.05); } 66% { transform: translate(-20px, 20px) scale(0.95); } }
            @keyframes login-fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes login-pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.3); } 70% { box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); } 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); } }
            .login-stagger-1 { animation: login-fade-up 0.6s ease-out 0.1s both; }
            .login-stagger-2 { animation: login-fade-up 0.6s ease-out 0.2s both; }
            .login-stagger-3 { animation: login-fade-up 0.6s ease-out 0.3s both; }
            .login-stagger-4 { animation: login-fade-up 0.6s ease-out 0.4s both; }
            .login-stagger-5 { animation: login-fade-up 0.6s ease-out 0.5s both; }
            .login-stagger-6 { animation: login-fade-up 0.6s ease-out 0.6s both; }
          `}</style>

            <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10">
                <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />}>
                    <SetupAccountContent />
                </Suspense>
            </div>
        </div>
    );
}
