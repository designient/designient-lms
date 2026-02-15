'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Toast, { showToast } from '@/components/Toast';

function ResetPasswordForm() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token') || '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/reset-password', { token, password });
            if (res.success) {
                showToast('success', 'Password reset! Redirecting to login...');
                setTimeout(() => router.push('/login'), 2000);
            } else {
                showToast('error', res.error?.message || 'Reset failed');
            }
        } catch {
            showToast('error', 'Something went wrong');
        }
        setLoading(false);
    };

    if (!token) {
        return <p style={{ color: 'var(--color-danger)' }}>Invalid or missing reset token. <Link href="/forgot-password">Request a new one</Link></p>;
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="auth-container">
            <Toast />
            <div className="auth-card">
                <h1 className="auth-title">Reset password</h1>
                <p className="auth-subtitle">Enter your new password below</p>
                <Suspense fallback={<div>Loading...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
