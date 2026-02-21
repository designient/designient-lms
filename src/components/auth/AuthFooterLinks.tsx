'use client';

import { AUTH_LEGAL_LINKS } from '@/content/auth';

export function AuthFooterLinks() {
    return (
        <nav className="auth-footer-links" aria-label="Legal links">
            {AUTH_LEGAL_LINKS.map((link) => (
                <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="auth-footer-link"
                >
                    {link.label}
                </a>
            ))}
        </nav>
    );
}
