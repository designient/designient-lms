'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/components/ui/Toast';
import { BrandProvider } from '@/components/BrandProvider';
import { ThemeInitializer } from '@/components/ThemeInitializer';
import React from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ToastProvider>
                <ThemeInitializer />
                <BrandProvider>
                    {children}
                </BrandProvider>
            </ToastProvider>
        </SessionProvider>
    );
}
