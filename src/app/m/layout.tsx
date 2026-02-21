'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { MentorSidebar } from '@/components/layout/MentorSidebar';
import { useSidebar } from '@/hooks/useSidebar';
import { PortalHeader } from '@/components/layout/PortalHeader';

export default function MentorLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { isCollapsed, toggle } = useSidebar();

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.replace('/login');
            return;
        }
        // Students shouldn't be here — redirect to student dashboard
        if (session.user.role === 'STUDENT') {
            router.replace('/s/dashboard');
        }
    }, [session, status, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    // Allow INSTRUCTOR and ADMIN roles
    if (!session || (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN')) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <MentorSidebar
                isCollapsed={isCollapsed}
                onToggle={toggle}
                userName={session.user.name || undefined}
                userEmail={session.user.email || undefined}
            />
            <div
                className={`transition-all duration-200 ${isCollapsed ? 'pl-16' : 'pl-64'}`}
            >
                <PortalHeader
                    portalLabel="Mentor Portal"
                    indicatorClassName="bg-violet-500"
                    profileHref="/m/profile"
                    settingsHref="/m/settings"
                />
                <main className="p-6 max-w-7xl mx-auto">{children}</main>
            </div>
        </div>
    );
}
