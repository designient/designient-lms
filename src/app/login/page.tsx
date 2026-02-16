'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => setMounted(true), []);

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
            const roleName =
                role === 'ADMIN' ? 'Admin' : role === 'INSTRUCTOR' ? 'Mentor' : 'Student';

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

    return (
        <>
            <style>{`
        @keyframes login-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes login-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.1); }
          66% { transform: translate(20px, -30px) scale(0.9); }
        }
        @keyframes login-float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(25px, 25px) scale(1.08); }
        }
        @keyframes login-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes login-pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.3); }
          70% { box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
        }
        .login-stagger-1 { animation: login-fade-up 0.6s ease-out 0.1s both; }
        .login-stagger-2 { animation: login-fade-up 0.6s ease-out 0.2s both; }
        .login-stagger-3 { animation: login-fade-up 0.6s ease-out 0.3s both; }
        .login-stagger-4 { animation: login-fade-up 0.6s ease-out 0.4s both; }
        .login-stagger-5 { animation: login-fade-up 0.6s ease-out 0.5s both; }
        .login-stagger-6 { animation: login-fade-up 0.6s ease-out 0.6s both; }
      `}</style>

            <div className="min-h-screen flex font-sans">
                {/* ═══════════════════════════════════════════
            LEFT PANEL — Designient Branding
           ═══════════════════════════════════════════ */}
                <div
                    className="hidden lg:flex lg:w-[46%] relative overflow-hidden"
                    style={{ background: '#0a0a0f' }}
                >
                    {/* Gradient mesh — subtle violet glow like designient.com */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background:
                                'radial-gradient(ellipse at 30% 20%, rgba(139, 92, 246, 0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)',
                        }}
                    />

                    {/* Floating orbs */}
                    <div
                        className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
                        style={{
                            top: '-8%',
                            right: '-10%',
                            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, transparent 60%)',
                            animation: 'login-float-1 20s ease-in-out infinite',
                        }}
                    />
                    <div
                        className="absolute w-[300px] h-[300px] rounded-full pointer-events-none"
                        style={{
                            bottom: '10%',
                            left: '-8%',
                            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 60%)',
                            animation: 'login-float-2 25s ease-in-out infinite',
                        }}
                    />
                    <div
                        className="absolute w-[200px] h-[200px] rounded-full pointer-events-none"
                        style={{
                            top: '45%',
                            left: '50%',
                            background: 'radial-gradient(circle, rgba(167, 139, 250, 0.10) 0%, transparent 60%)',
                            animation: 'login-float-3 18s ease-in-out infinite',
                        }}
                    />

                    {/* Content — vertically distributed */}
                    <div className="relative z-10 flex flex-col justify-between h-full w-full p-10 xl:p-14">

                        {/* Top — Logo */}
                        <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="https://cdn.magicpatterns.com/uploads/jGmmhXeUn6N54eHSNgjaoE/designient-logo.svg"
                                alt="Designient"
                                className="h-10 xl:h-12 brightness-0 invert"
                            />
                        </div>

                        {/* Center — Hero block */}
                        <div className="space-y-8 max-w-[420px]">
                            {/* Label */}
                            <div className="flex items-center gap-2.5">
                                <div className="h-px w-8 bg-violet-500/50" />
                                <span className="text-[11px] uppercase tracking-[0.25em] text-violet-400/80 font-semibold">
                                    Workspace Portal
                                </span>
                            </div>

                            {/* Headline */}
                            <h2 className="text-[2.5rem] xl:text-[2.85rem] font-bold text-white leading-[1.1] tracking-tight">
                                Access Your
                                <br />
                                Designient
                                <br />
                                <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
                                    Workspace
                                </span>
                            </h2>

                            {/* Description */}
                            <p className="text-[15px] text-white/45 leading-[1.7]">
                                Manage cohorts, assignments, mentorship programs, and operations — all in one place.
                            </p>

                            {/* Role pills — matching designient.com badge style */}
                            <div className="flex flex-wrap items-center gap-2.5 pt-2">
                                {['Administrators', 'Mentors', 'Students'].map((role) => (
                                    <span
                                        key={role}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-medium text-white/60"
                                        style={{
                                            background: 'rgba(139, 92, 246, 0.08)',
                                            border: '1px solid rgba(139, 92, 246, 0.15)',
                                        }}
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400/50" />
                                        {role}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Bottom — Trust bar */}
                        <div className="flex items-center gap-8">
                            {[
                                'Encrypted Access',
                                'Role-Based Permissions',
                                'Audit Logged',
                            ].map((item, i) => (
                                <div key={item} className="flex items-center gap-2">
                                    {i > 0 && <div className="h-3 w-px bg-white/10 -ml-4 mr-0" />}
                                    <span className="text-[11px] text-white/25 tracking-wide font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════
            RIGHT PANEL — Login Form
           ═══════════════════════════════════════════ */}
                <div className="flex-1 flex flex-col bg-background relative">
                    {/* System Status */}
                    <div className="hidden lg:block absolute top-8 right-8">
                        <button
                            type="button"
                            className="flex items-center gap-2 text-[11px] text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
                            title="View system status"
                        >
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            System Status: Operational
                        </button>
                    </div>

                    {/* Form — centered */}
                    <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10">
                        <div className={`w-full max-w-[420px] space-y-7 ${mounted ? '' : 'opacity-0'}`}>
                            {/* Mobile-only logo */}
                            <div className="lg:hidden flex flex-col items-center mb-4 login-stagger-1">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="https://cdn.magicpatterns.com/uploads/jGmmhXeUn6N54eHSNgjaoE/designient-logo.svg"
                                    alt="Designient"
                                    className="h-8 mb-2"
                                />
                                <p className="text-[11px] text-muted-foreground/60 uppercase tracking-widest">
                                    Workspace Portal
                                </p>
                            </div>

                            {/* Heading */}
                            <div className="space-y-2 login-stagger-1">
                                <h1 className="text-2xl lg:text-[1.75rem] font-bold tracking-tight text-foreground">
                                    Sign in to your workspace
                                </h1>
                                <p className="text-[13px] text-muted-foreground leading-relaxed">
                                    Use your registered email to continue.
                                </p>
                            </div>

                            {/* Error Banner */}
                            {error && (
                                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/15 text-[13px] text-red-600 dark:text-red-400"
                                    style={{ animation: 'login-fade-up 0.3s ease-out' }}
                                >
                                    <span className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" style={{ animation: 'login-pulse-ring 2s infinite' }} />
                                    {error}
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Email */}
                                <div className="space-y-1.5 login-stagger-2">
                                    <label htmlFor="email" className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">
                                        Email
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-muted-foreground/40 group-focus-within:text-primary/60 transition-colors pointer-events-none" />
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="name@designient.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoComplete="email"
                                            className="flex h-11 w-full rounded-xl border border-border/50 bg-card/50 pl-10 pr-4 text-[13px] transition-all duration-200 placeholder:text-muted-foreground/30 hover:border-border focus:border-primary/40 focus:outline-none focus:ring-[3px] focus:ring-primary/8 focus:bg-card"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5 login-stagger-3">
                                    <label htmlFor="password" className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">
                                        Password
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
                                            autoComplete="current-password"
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

                                {/* Remember me + Reset password */}
                                <div className="flex items-center justify-between login-stagger-4">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                className="peer sr-only"
                                            />
                                            <div className="h-4 w-4 rounded border border-border/60 bg-card/50 peer-checked:bg-primary peer-checked:border-primary transition-all duration-150 flex items-center justify-center">
                                                {rememberMe && (
                                                    <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-[12px] text-muted-foreground/70 group-hover:text-foreground/70 transition-colors select-none">
                                            Remember me
                                        </span>
                                    </label>
                                    <button
                                        type="button"
                                        className="text-[12px] font-medium text-primary/80 hover:text-primary transition-colors"
                                    >
                                        Reset password
                                    </button>
                                </div>

                                {/* Submit */}
                                <div className="login-stagger-5 pt-1">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="relative group inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-[13px] shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all duration-200"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Signing in...
                                            </>
                                        ) : (
                                            <>
                                                Sign In
                                                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>

                            {/* Role clarification */}
                            <p className="text-center text-[11px] text-muted-foreground/50 login-stagger-6">
                                Students, mentors, and administrators sign in here.
                            </p>

                            {/* Security signal */}
                            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/40 login-stagger-6">
                                <ShieldCheck className="h-3 w-3" />
                                <span>Secure login &bull; Encrypted session</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-5 flex items-center justify-center gap-6 border-t border-border/20">
                        <button type="button" className="text-[11px] text-muted-foreground/45 hover:text-muted-foreground/70 transition-colors">
                            Privacy Policy
                        </button>
                        <button type="button" className="text-[11px] text-muted-foreground/45 hover:text-muted-foreground/70 transition-colors">
                            Terms of Service
                        </button>
                        <button type="button" className="text-[11px] text-muted-foreground/45 hover:text-muted-foreground/70 transition-colors">
                            Support
                        </button>
                        <button type="button" className="text-[11px] text-muted-foreground/45 hover:text-muted-foreground/70 transition-colors flex items-center gap-1.5">
                            <div className="h-1 w-1 rounded-full bg-emerald-500" />
                            System Status
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
