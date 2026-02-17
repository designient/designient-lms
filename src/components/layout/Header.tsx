'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Search, ChevronDown } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useBrand } from '@/components/BrandProvider';
import { SearchModal } from './SearchModal';
import { NotificationsPanel } from './NotificationsPanel';
import { UserMenu } from './UserMenu';
import type { PageName } from '@/types';

interface HeaderProps {
    title: string;
    subtitle?: string;
    onNavigate?: (page: PageName) => void;
    onSelectEntity?: (type: 'student' | 'mentor' | 'cohort', id: string) => void;
}

export function Header({ title, subtitle, onNavigate, onSelectEntity }: HeaderProps) {
    const { data: session } = useSession();
    const { logoUrl } = useBrand();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleNavigate = (page: PageName) => {
        if (onNavigate) onNavigate(page);
    };

    return (
        <>
            <header className="sticky top-0 z-30 flex h-12 w-full items-center justify-between border-b border-border/50 bg-card/95 px-4 backdrop-blur-sm">
                {/* Page Title */}
                <div className="flex items-baseline gap-2">
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
                    {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1.5">
                    {/* Search */}
                    <div className="relative hidden md:block">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="flex items-center h-7 w-48 rounded-md border border-border/60 bg-background px-2.5 pl-7 text-xs text-muted-foreground/50 hover:border-primary/40 hover:bg-card transition-all duration-150 text-left"
                        >
                            <span>Search...</span>
                            <span className="ml-auto text-[9px] opacity-60 font-mono border border-border px-1 rounded">
                                ⌘K
                            </span>
                        </button>
                    </div>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className={`relative rounded-md p-1.5 transition-colors duration-150 ${isNotificationsOpen
                                ? 'bg-muted text-foreground'
                                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                                }`}
                        >
                            <Bell className="h-4 w-4" />
                            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-card" />
                        </button>
                        <NotificationsPanel
                            open={isNotificationsOpen}
                            onClose={() => setIsNotificationsOpen(false)}
                        />
                    </div>

                    {/* Divider */}
                    <div className="h-4 w-px bg-border/60 mx-0.5" />

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors duration-150 ${isUserMenuOpen ? 'bg-muted/60' : 'hover:bg-muted/60'
                                }`}
                        >
                            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-semibold text-primary overflow-hidden">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Brand" className="h-full w-full object-cover" />
                                ) : (
                                    session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'
                                )}
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-xs font-medium text-foreground leading-none">
                                    {session?.user?.name || 'User'}
                                </p>
                            </div>
                            <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
                        </button>
                        <UserMenu
                            open={isUserMenuOpen}
                            onClose={() => setIsUserMenuOpen(false)}
                            onNavigate={handleNavigate}
                        />
                    </div>
                </div>
            </header>

            <SearchModal
                open={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onNavigate={handleNavigate}
                onSelectEntity={onSelectEntity}
            />
        </>
    );
}
