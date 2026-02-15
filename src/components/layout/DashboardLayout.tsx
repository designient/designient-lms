'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSidebar } from '@/hooks/useSidebar';
import type { PageName } from '@/types';

interface DashboardLayoutProps {
    title: string;
    subtitle?: string;
    currentPage: PageName;
    onNavigate: (page: PageName) => void;
    onBillingClick?: () => void;
    onSelectEntity?: (type: 'student' | 'mentor' | 'cohort', id: string) => void;
    children: React.ReactNode;
}

export function DashboardLayout({
    title,
    subtitle,
    currentPage,
    onNavigate,
    onBillingClick,
    onSelectEntity,
    children,
}: DashboardLayoutProps) {
    const { isCollapsed, toggle } = useSidebar();

    return (
        <div className="min-h-screen bg-background">
            <Sidebar
                currentPage={currentPage}
                onNavigate={onNavigate}
                isCollapsed={isCollapsed}
                onToggle={toggle}
                onBillingClick={onBillingClick}
            />
            <div
                className={`transition-all duration-200 ${isCollapsed ? 'pl-16' : 'pl-64'}`}
            >
                <Header
                    title={title}
                    subtitle={subtitle}
                    onNavigate={onNavigate}
                    onSelectEntity={onSelectEntity}
                />
                <main className="p-6 max-w-7xl mx-auto">{children}</main>
            </div>
        </div>
    );
}
