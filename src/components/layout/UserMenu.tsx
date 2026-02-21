'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, HelpCircle, Sun, Moon, Monitor, ShieldCheck, FileText } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useTheme, type Theme } from '@/hooks/useTheme';
import type { PageName } from '@/types';

interface UserMenuProps {
    open: boolean;
    onClose: () => void;
    onNavigate?: (page: PageName) => void;
    profileHref?: string;
    settingsHref?: string;
}

const PRIVACY_URL = 'https://designient.com/privacy-policy';
const TERMS_URL = 'https://designient.com/terms-and-conditions';
const SUPPORT_URL = 'https://designient.com/contact-us';

function getRoleDefaultRoutes(role?: string) {
    if (role === 'INSTRUCTOR') {
        return { profileHref: '/m/profile', settingsHref: '/m/settings' };
    }
    if (role === 'STUDENT') {
        return { profileHref: '/s/profile', settingsHref: '/s/settings' };
    }
    return { profileHref: '/settings', settingsHref: '/settings' };
}

export function UserMenu({ open, onClose, onNavigate, profileHref, settingsHref }: UserMenuProps) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const { data: session } = useSession();
    const router = useRouter();

    if (!open) return null;

    const defaults = getRoleDefaultRoutes(session?.user?.role);
    const resolvedProfileHref = profileHref || defaults.profileHref;
    const resolvedSettingsHref = settingsHref || defaults.settingsHref;

    const handleNavigate = (page: PageName, href: string) => {
        if (onNavigate) {
            onNavigate(page);
        } else {
            router.push(href);
        }
        onClose();
    };

    const handleLogout = () => {
        signOut({ callbackUrl: '/login' });
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
                        onClick={() => handleNavigate('settings', resolvedProfileHref)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-foreground rounded-md hover:bg-muted/60 transition-colors"
                    >
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        Profile
                    </button>
                    <button
                        onClick={() => handleNavigate('settings', resolvedSettingsHref)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-foreground rounded-md hover:bg-muted/60 transition-colors"
                    >
                        <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                        Settings
                    </button>
                    <Link
                        href={PRIVACY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-foreground rounded-md hover:bg-muted/60 transition-colors"
                    >
                        <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        Privacy Policy
                    </Link>
                    <Link
                        href={TERMS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-foreground rounded-md hover:bg-muted/60 transition-colors"
                    >
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        Terms of Service
                    </Link>
                    <Link
                        href={SUPPORT_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-foreground rounded-md hover:bg-muted/60 transition-colors"
                    >
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        Help & Support
                    </Link>
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
