'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { useSidebar } from '@/hooks/useSidebar';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { isCollapsed, toggle } = useSidebar();

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.replace('/login');
            return;
        }
        if (session.user.role === 'INSTRUCTOR') {
            router.replace('/m/dashboard');
            return;
        }
        if (session.user.role === 'ADMIN') {
            router.replace('/dashboard');
        }
    }, [session, status, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (!session || session.user.role !== 'STUDENT') {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <StudentSidebar
                isCollapsed={isCollapsed}
                onToggle={toggle}
                userName={session.user.name || undefined}
                userEmail={session.user.email || undefined}
            />
            <div
                className={`transition-all duration-200 ${isCollapsed ? 'pl-16' : 'pl-64'}`}
            >
                {/* Simple student header */}
                <header className="sticky top-0 z-30 flex h-12 w-full items-center justify-between border-b border-border/50 bg-card/95 px-6 backdrop-blur-sm">
                    <div />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>Student Portal</span>
                    </div>
                </header>
                <main className="p-6 max-w-7xl mx-auto">{children}</main>
            </div>
        </div>
    );
}
