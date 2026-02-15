'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import Toast, { showToast } from '@/components/Toast';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
        } catch {
            showToast('error', 'Something went wrong');
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <Toast />
            <div className="auth-card">
                <h1 className="auth-title">Forgot password?</h1>
                <p className="auth-subtitle">Enter your email and we&apos;ll send a reset link</p>
                {sent ? (
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '3rem' }}>📧</span>
                        <h3 style={{ margin: '1rem 0 0.5rem', color: 'var(--color-success)' }}>Check your email</h3>
                        <p style={{ color: 'var(--color-text-muted)' }}>
                            If an account exists with that email, we&apos;ve sent a reset link.
                        </p>
                        <Link href="/login" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
                            <button className="btn btn-secondary">Back to Login</button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input type="email" className="form-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginTop: '1.5rem' }}>
                    <Link href="/login">← Back to Sign In</Link>
                </p>
            </div>
        </div>
    );
}
