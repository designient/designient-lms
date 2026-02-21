'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useBrand } from '@/components/BrandProvider';
import { UserMenu } from '@/components/layout/UserMenu';

interface PortalHeaderProps {
    portalLabel: string;
    indicatorClassName: string;
    profileHref: string;
    settingsHref: string;
}

export function PortalHeader({
    portalLabel,
    indicatorClassName,
    profileHref,
    settingsHref,
}: PortalHeaderProps) {
    const { data: session } = useSession();
    const { logoUrl } = useBrand();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-30 flex h-12 w-full items-center justify-between border-b border-border/50 bg-card/95 px-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className={`h-2 w-2 rounded-full ${indicatorClassName}`} />
                <span>{portalLabel}</span>
            </div>

            <div className="relative">
                <button
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
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
                    profileHref={profileHref}
                    settingsHref={settingsHref}
                />
            </div>
        </header>
    );
}
