'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Layers,
    BookOpen,
    GraduationCap,
    FileText,
    ClipboardCheck,
    HelpCircle,
    User,
    LogOut,
    PanelLeftClose,
    PanelLeft,
    Video,
    FolderOpen,
    Library,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useBrand } from '@/components/BrandProvider';

interface TooltipProps {
    label: string;
    show: boolean;
    children: React.ReactNode;
}

function Tooltip({ label, show, children }: TooltipProps) {
    if (!show) return <>{children}</>;
    return (
        <div className="relative group">
            {children}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-foreground text-background text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {label}
            </div>
        </div>
    );
}

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/m/dashboard' },
    { icon: Layers, label: 'My Cohorts', href: '/m/cohorts' },
    { icon: BookOpen, label: 'My Programs', href: '/m/programs' },
    { icon: GraduationCap, label: 'My Students', href: '/m/students' },
    { icon: ClipboardCheck, label: 'Attendance', href: '/m/attendance' },
    { icon: FileText, label: 'Submissions', href: '/m/submissions' },
    { icon: Video, label: 'Recordings', href: '/m/recordings' },
    { icon: FolderOpen, label: 'Materials', href: '/m/materials' },
    { icon: HelpCircle, label: 'Quizzes', href: '/m/quizzes' },
    { icon: Library, label: 'Question Bank', href: '/m/question-bank' },
    { icon: User, label: 'Profile', href: '/m/profile' },
];

interface MentorSidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
    userName?: string;
    userEmail?: string;
}

export function MentorSidebar({
    isCollapsed,
    onToggle,
    userName,
    userEmail,
}: MentorSidebarProps) {
    const pathname = usePathname();
    const { logoUrl, orgName } = useBrand();

    const initials = userName
        ? userName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : 'MT';

    return (
        <aside
            className={`fixed left-0 top-0 z-40 h-screen border-r border-border/50 bg-card transition-all duration-200 ease-in-out flex flex-col ${isCollapsed ? 'w-16' : 'w-64'}`}
        >
            {/* Logo */}
            <div className="flex h-14 items-center justify-center border-b border-border/50 px-3">
                <div
                    className={`rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden ${isCollapsed ? 'h-9 w-9' : 'h-10 w-10'}`}
                >
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt="Logo"
                            className="h-full w-full object-contain"
                        />
                    ) : (
                        <span
                            className={`text-primary font-bold ${isCollapsed ? 'text-lg' : 'text-xl'}`}
                        >
                            {orgName ? orgName.charAt(0).toUpperCase() : 'D'}
                        </span>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                <div>
                    {!isCollapsed && (
                        <h3 className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Teaching
                        </h3>
                    )}
                    <nav className="space-y-0.5">
                        {navItems.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                (item.href !== '/m/dashboard' &&
                                    pathname.startsWith(item.href));
                            return (
                                <Tooltip
                                    key={item.href}
                                    label={item.label}
                                    show={isCollapsed}
                                >
                                    <Link
                                        href={item.href}
                                        className={`w-full flex items-center rounded-md transition-all duration-150 group ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'} ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
                                    >
                                        <item.icon
                                            className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary' : 'group-hover:text-foreground'}`}
                                        />
                                        {!isCollapsed && (
                                            <span className="text-sm font-medium">
                                                {item.label}
                                            </span>
                                        )}
                                    </Link>
                                </Tooltip>
                            );
                        })}
                    </nav>
                </div>

                {/* Sign out */}
                <div className="pt-2 border-t border-border/40">
                    <Tooltip label="Sign Out" show={isCollapsed}>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className={`w-full flex items-center rounded-md transition-all duration-150 group ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'} text-muted-foreground hover:bg-destructive/10 hover:text-destructive`}
                        >
                            <LogOut className="h-4 w-4 flex-shrink-0" />
                            {!isCollapsed && (
                                <span className="text-sm font-medium">
                                    Sign Out
                                </span>
                            )}
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* Footer / User Profile */}
            <div className="p-3 border-t border-border/50 bg-card">
                <div
                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-2'}`}
                >
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm flex-shrink-0">
                        {initials}
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                                {userName || 'Mentor'}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                                {userEmail || ''}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Collapse Toggle */}
            <button
                onClick={onToggle}
                className="absolute -right-3 top-18 h-6 w-6 rounded-full border border-border/50 bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all shadow-sm"
            >
                {isCollapsed ? (
                    <PanelLeft className="h-3 w-3" />
                ) : (
                    <PanelLeftClose className="h-3 w-3" />
                )}
            </button>
        </aside>
    );
}
