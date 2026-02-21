'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    id: string;
    label: string;
    icon: LucideIcon;
    trailing?: ReactNode;
    hint?: string;
}

export function AuthField({ id, label, icon: Icon, trailing, hint, className, ...inputProps }: AuthFieldProps) {
    const inputClassName = ['auth-input', trailing ? 'auth-input-with-trailing' : '', className || '']
        .filter(Boolean)
        .join(' ');

    return (
        <div className="auth-field">
            <label htmlFor={id} className="auth-field-label">
                {label}
            </label>
            <div className="auth-input-wrap">
                <Icon className="auth-input-icon" aria-hidden="true" />
                <input id={id} className={inputClassName} {...inputProps} />
                {trailing ? <div className="auth-input-trailing">{trailing}</div> : null}
            </div>
            {hint ? <p className="auth-field-hint">{hint}</p> : null}
        </div>
    );
}
