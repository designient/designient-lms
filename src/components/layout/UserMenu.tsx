'use client';

import React from 'react';
import { User, Settings, LogOut, HelpCircle, Sun, Moon, Monitor } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useTheme, type Theme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import type { PageName } from '@/types';

interface UserMenuProps {
    open: boolean;
    onClose: () => void;
    onNavigate: (page: PageName) => void;
}

export function UserMenu({ open, onClose, onNavigate }: UserMenuProps) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const { data: session } = useSession();
    const { toast } = useToast();

    if (!open) return null;

    const handleNavigate = (page: PageName) => {
        onNavigate(page);
        onClose();
    };

    const handleLogout = () => {
        signOut({ callbackUrl: '/login' });
        onClose();
    };



    const handleHelp = () => {
        // Placeholder for Help & Support
        toast({
            title: 'Help & Support',
            description: 'For support, please contact the administrator.',
            variant: 'info',
        });
        onClose();
    };

    const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
        { value: 'light', label: 'Light', icon: <Sun className="h-3 w-3" /> },
        { value: 'dark', label: 'Dark', icon: <Moon className="h-3 w-3" /> },
        { value: 'system', label: 'Auto', icon: <Monitor className="h-3 w-3" /> },
    ];

    return (
        <>
            <div className="fixed inset-0 z-30" onClick={onClose} aria-hidden="true" />
            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-lg border border-border/50 bg-card shadow-xl z-40">
                {/* User Info */}
                <div className="p-2.5 border-b border-border/50">
                    <p className="text-[13px] font-medium text-foreground">
                        {session?.user?.name || 'User'}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                        {session?.user?.email || 'No email'}
                    </p>
                </div>

                {/* Theme Selector */}
                <div className="p-2.5 border-b border-border/50">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                            Appearance
                        </span>
                        {resolvedTheme === 'dark' ? (
                            <Moon className="h-3 w-3 text-muted-foreground" />
                        ) : (
                            <Sun className="h-3 w-3 text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex gap-0.5 p-0.5 bg-muted/50 rounded-md">
                        {themeOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setTheme(option.value)}
                                className={`flex-1 flex items-center justify-center gap-1 px-1.5 py-1 rounded text-[10px] font-medium transition-all ${theme === option.value
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {option.icon}
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="p-1">
                    <button
                        onClick={() => handleNavigate('settings')}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-foreground rounded-md hover:bg-muted/60 transition-colors"
                    >
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        Profile
                    </button>
                    <button
                        onClick={() => handleNavigate('settings')}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-foreground rounded-md hover:bg-muted/60 transition-colors"
                    >
                        <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                        Settings
                    </button>
                    <button
                        onClick={handleHelp}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-foreground rounded-md hover:bg-muted/60 transition-colors"
                    >
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        Help & Support
                    </button>
                </div>

                {/* Logout */}
                <div className="p-1 border-t border-border/50">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        Log out
                    </button>
                </div>
            </div>
        </>
    );
}
