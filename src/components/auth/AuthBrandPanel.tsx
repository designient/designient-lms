'use client';

import { AUTH_BRAND_COPY } from '@/content/auth';

const AUTH_LOGO_URL = 'https://designient.com/designient-logo.svg';

interface AuthBrandPanelProps {
    compact?: boolean;
}

export function AuthBrandPanel({ compact = false }: AuthBrandPanelProps) {
    if (compact) {
        return (
            <div className="auth-mobile-brand auth-fade-in" style={{ animationDelay: '0.08s' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={AUTH_LOGO_URL} alt="Designient" className="auth-mobile-logo" />
                <div>
                    <p className="auth-mobile-brand-eyebrow">{AUTH_BRAND_COPY.eyebrow}</p>
                </div>
            </div>
        );
    }

    return (
        <aside className="auth-brand-panel" aria-hidden="true">
            <div className="auth-brand-gradient" />
            <div className="auth-orb auth-orb-one" />
            <div className="auth-orb auth-orb-two" />
            <div className="auth-orb auth-orb-three" />

            <div className="auth-brand-content">
                <div className="auth-brand-top auth-fade-in" style={{ animationDelay: '0.08s' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={AUTH_LOGO_URL} alt="Designient" className="auth-brand-logo" />
                </div>

                <div className="auth-brand-main">
                    <div className="auth-eyebrow auth-fade-in" style={{ animationDelay: '0.14s' }}>
                        <span className="auth-eyebrow-line" />
                        {AUTH_BRAND_COPY.eyebrow}
                    </div>
                    <h2 className="auth-brand-headline auth-fade-in" style={{ animationDelay: '0.2s' }}>
                        {AUTH_BRAND_COPY.headline}
                    </h2>
                    <p className="auth-brand-description auth-fade-in" style={{ animationDelay: '0.26s' }}>
                        {AUTH_BRAND_COPY.description}
                    </p>

                    <div className="auth-capabilities auth-fade-in" style={{ animationDelay: '0.32s' }}>
                        {AUTH_BRAND_COPY.capabilities.map((item) => (
                            <span key={item.label} className="auth-capability-pill">
                                {item.label}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="auth-trust auth-fade-in" style={{ animationDelay: '0.38s' }}>
                    {AUTH_BRAND_COPY.trust.map((item) => (
                        <span key={item.label} className="auth-trust-chip">
                            {item.label}
                        </span>
                    ))}
                </div>
            </div>
        </aside>
    );
}
