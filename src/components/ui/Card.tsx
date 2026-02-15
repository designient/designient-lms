'use client';

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Card({ className = '', ...props }: CardProps) {
    return (
        <div
            className={`rounded-lg border border-border/50 bg-card text-card-foreground shadow-sm transition-all duration-200 dark:shadow-[0_2px_10px_-3px_rgba(0,0,0,0.3)] dark:border-border/40 ${className}`}
            {...props}
        />
    );
}

export function CardHeader({ className = '', ...props }: CardProps) {
    return (
        <div
            className={`flex flex-col space-y-1 p-4 pb-3 ${className}`}
            {...props}
        />
    );
}

export function CardTitle({
    className = '',
    ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={`text-sm font-semibold tracking-tight leading-none text-foreground ${className}`}
            {...props}
        />
    );
}

export function CardDescription({
    className = '',
    ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className={`text-xs text-muted-foreground ${className}`} {...props} />
    );
}

export function CardContent({ className = '', ...props }: CardProps) {
    return <div className={`p-4 pt-0 ${className}`} {...props} />;
}

export function CardFooter({ className = '', ...props }: CardProps) {
    return (
        <div className={`flex items-center p-4 pt-0 ${className}`} {...props} />
    );
}
