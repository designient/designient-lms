'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Toast, { showToast } from '@/components/Toast';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        try {
            const res = await api.post('/auth/signup', { name, email, password });
            if (res.success) {
                showToast('success', 'Account created! Please sign in.');
                setTimeout(() => router.push('/login'), 1500);
            } else {
                if (res.error?.details && Array.isArray(res.error.details)) {
                    const fieldErrors: Record<string, string> = {};
                    (res.error.details as { field: string; message: string }[]).forEach((d) => {
                        fieldErrors[d.field] = d.message;
                    });
                    setErrors(fieldErrors);
                } else {
                    showToast('error', res.error?.message || 'Signup failed');
                }
            }
        } catch {
            showToast('error', 'Something went wrong');
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <Toast />
            <div className="auth-card">
                <h1 className="auth-title">Create account</h1>
                <p className="auth-subtitle">Start learning today on LearnHub</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        {errors.name && <span className="form-error">{errors.name}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        {errors.email && <span className="form-error">{errors.email}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Min 8 chars, 1 uppercase, 1 number"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                        {errors.password && <span className="form-error">{errors.password}</span>}
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginTop: '1.5rem' }}>
                    Already have an account? <Link href="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
