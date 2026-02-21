'use client';

import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';
import { AuthFooterLinks } from '@/components/auth/AuthFooterLinks';

interface AuthShellProps {
    children: ReactNode;
    showStatus?: boolean;
    contentClassName?: string;
}

export function AuthShell({ children, showStatus = false, contentClassName }: AuthShellProps) {
    const contentWrapClassName = ['auth-content-wrap', contentClassName || ''].join(' ').trim();

    return (
        <div className="auth-shell">
            <AuthBrandPanel />

            <main className="auth-main">
                <div className="auth-main-top">
                    {showStatus ? (
                        <div className="auth-system-status auth-fade-in" style={{ animationDelay: '0.05s' }}>
                            <span className="auth-status-dot" aria-hidden="true" />
                            <span>System Status: Operational</span>
                        </div>
                    ) : (
                        <div />
                    )}
                </div>

                <div className="auth-main-inner">
                    <div className={contentWrapClassName}>
                        <AuthBrandPanel compact />
                        {children}
                    </div>
                </div>

                <footer className="auth-main-footer">
                    <AuthFooterLinks />
                    <div className="auth-footer-security">
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Secure authentication</span>
                    </div>
                    <p className="auth-copyright">
                        © 2026 Designient CohortOS. Product of{' '}
                        <a href="https://designient.com" target="_blank" rel="noreferrer noopener" className="auth-copyright-link">
                            Designient Technologies
                        </a>
                        . All rights reserved.
                    </p>
                </footer>
            </main>
        </div>
    );
}
