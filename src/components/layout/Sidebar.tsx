'use client';

import React from 'react';
import {
    LayoutDashboard,
    BarChart3,
    MessageSquare,
    Layers,
    BookOpen,
    GraduationCap,
    UserCheck,
    Eye,
    ArrowLeftRight,
    Settings,
    CreditCard,
    PanelLeftClose,
    PanelLeft,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useBrand } from '@/components/BrandProvider';
import type { PageName } from '@/types';

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

interface SidebarProps {
    currentPage: PageName;
    onNavigate: (page: PageName) => void;
    isCollapsed: boolean;
    onToggle: () => void;
    onBillingClick?: () => void;
}

export function Sidebar({
    currentPage,
    onNavigate,
    isCollapsed,
    onToggle,
    onBillingClick,
}: SidebarProps) {
    const { toast } = useToast();
    const { logoUrl, orgName: brandOrgName } = useBrand();

    const handleComingSoon = (feature: string) => {
        toast({
            title: 'Coming Soon',
            description: `${feature} functionality is currently under development.`,
            variant: 'info',
        });
    };

    return (
        <aside
            className={`fixed left-0 top-0 z-40 h-screen border-r border-border/50 bg-card transition-all duration-200 ease-in-out flex flex-col ${isCollapsed ? 'w-16' : 'w-64'}`}
        >
            {/* Logo */}
            <div
                className={`flex h-14 items-center justify-center border-b border-border/50 px-3`}
            >
                <div className={`rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden ${isCollapsed ? 'h-9 w-9' : 'h-10 w-10'}`}>
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                    ) : (
                        <span className={`text-primary font-bold ${isCollapsed ? 'text-lg' : 'text-xl'}`}>
                            {brandOrgName ? brandOrgName.charAt(0).toUpperCase() : 'D'}
                        </span>
                    )}
                </div>
            </div>

            {/* Navigation Content */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                {/* MAIN Section */}
                <div>
                    {!isCollapsed && (
                        <h3 className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Main
                        </h3>
                    )}
                    <nav className="space-y-0.5">
                        {[
                            { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' as PageName },
                            { icon: BarChart3, label: 'Analytics', page: 'analytics' as PageName },
                            { icon: MessageSquare, label: 'Communications', page: 'communications' as PageName },
                        ].map((item) => {
                            const isActive = currentPage === item.page;
                            return (
                                <Tooltip key={item.label} label={item.label} show={isCollapsed}>
                                    <button
                                        onClick={() => onNavigate(item.page)}
                                        className={`w-full flex items-center rounded-md transition-all duration-150 group ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'} ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
                                    >
                                        <item.icon
                                            className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary' : 'group-hover:text-foreground'}`}
                                        />
                                        {!isCollapsed && (
                                            <span className="text-sm font-medium">{item.label}</span>
                                        )}
                                    </button>
                                </Tooltip>
                            );
                        })}
                    </nav>
                </div>

                {/* YOUR ACADEMY Section */}
                <div>
                    {!isCollapsed && (
                        <h3 className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-6">
                            Your Academy
                        </h3>
                    )}
                    <nav className="space-y-0.5">
                        {[
                            { icon: Layers, label: 'Cohorts', page: 'cohorts' as PageName },
                            { icon: BookOpen, label: 'Programs', page: 'programs' as PageName },
                            { icon: GraduationCap, label: 'Students', page: 'students' as PageName },
                            { icon: UserCheck, label: 'Mentors', page: 'mentors' as PageName },
                        ].map((item) => {
                            const isActive = currentPage === item.page;
                            return (
                                <Tooltip key={item.label} label={item.label} show={isCollapsed}>
                                    <button
                                        onClick={() => onNavigate(item.page)}
                                        className={`w-full flex items-center rounded-md transition-all duration-150 group ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'} ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
                                    >
                                        <item.icon
                                            className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary' : 'group-hover:text-foreground'}`}
                                        />
                                        {!isCollapsed && (
                                            <span className="text-sm font-medium">{item.label}</span>
                                        )}
                                    </button>
                                </Tooltip>
                            );
                        })}

                        {/* Academy Actions */}
                        <div className="pt-2 mt-2 border-t border-border/40 space-y-0.5">
                            <Tooltip label="Preview Academy" show={isCollapsed}>
                                <button
                                    onClick={() => handleComingSoon('Academy Preview')}
                                    className={`w-full flex items-center rounded-md transition-all duration-150 group ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'} text-muted-foreground hover:bg-muted/60 hover:text-foreground`}
                                >
                                    <Eye className="h-4 w-4 flex-shrink-0 group-hover:text-foreground" />
                                    {!isCollapsed && <span className="text-sm font-medium">Preview</span>}
                                </button>
                            </Tooltip>
                            <Tooltip label="Switch Academy" show={isCollapsed}>
                                <button
                                    onClick={() => handleComingSoon('Switch Academy')}
                                    className={`w-full flex items-center rounded-md transition-all duration-150 group ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'} text-muted-foreground hover:bg-muted/60 hover:text-foreground`}
                                >
                                    <ArrowLeftRight className="h-4 w-4 flex-shrink-0 group-hover:text-foreground" />
                                    {!isCollapsed && <span className="text-sm font-medium">Switch</span>}
                                </button>
                            </Tooltip>
                            <Tooltip label="Settings" show={isCollapsed}>
                                <button
                                    onClick={() => onNavigate('settings')}
                                    className={`w-full flex items-center rounded-md transition-all duration-150 group ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'} ${currentPage === 'settings' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
                                >
                                    <Settings className="h-4 w-4 flex-shrink-0" />
                                    {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
                                </button>
                            </Tooltip>
                            <Tooltip label="Billing" show={isCollapsed}>
                                <button
                                    onClick={onBillingClick}
                                    className={`w-full flex items-center rounded-md transition-all duration-150 group ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'} text-muted-foreground hover:bg-muted/60 hover:text-foreground`}
                                >
                                    <CreditCard className="h-4 w-4 flex-shrink-0 group-hover:text-foreground" />
                                    {!isCollapsed && <span className="text-sm font-medium">Billing</span>}
                                </button>
                            </Tooltip>
                        </div>
                    </nav>
                </div>
            </div>

            {/* Footer / User Profile */}
            <div className="p-3 border-t border-border/50 bg-card">
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-2'}`}>
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                        SA
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">Super Admin</p>
                            <p className="text-[10px] text-muted-foreground truncate">admin@designient.com</p>
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
