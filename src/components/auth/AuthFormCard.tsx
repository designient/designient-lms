'use client';

import type { ReactNode } from 'react';

interface AuthFormCardProps {
    title: string;
    subtitle: string;
    children: ReactNode;
    titleClassName?: string;
    className?: string;
}

export function AuthFormCard({ title, subtitle, children, titleClassName, className }: AuthFormCardProps) {
    return (
        <section className={['auth-form-card', className || '', 'auth-fade-in'].join(' ').trim()} style={{ animationDelay: '0.12s' }}>
            <header className="auth-form-header">
                <h1 className={['auth-form-title', titleClassName || ''].join(' ').trim()}>{title}</h1>
                <p className="auth-form-subtitle">{subtitle}</p>
            </header>
            {children}
        </section>
    );
}
