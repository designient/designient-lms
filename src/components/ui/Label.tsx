'use client';

import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    required?: boolean;
}

export function Label({
    className = '',
    required,
    children,
    ...props
}: LabelProps) {
    return (
        <label
            className={`text-xs font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
            {...props}
        >
            {children}
            {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
    );
}
