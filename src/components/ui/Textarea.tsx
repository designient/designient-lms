'use client';

import React from 'react';

interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

export function Textarea({ className = '', ...props }: TextareaProps) {
    return (
        <textarea
            className={`flex min-h-[80px] w-full rounded-md border border-border/60 bg-card px-3 py-2 text-sm transition-all duration-150 placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            {...props}
        />
    );
}
