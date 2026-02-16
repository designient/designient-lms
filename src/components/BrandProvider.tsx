'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Converts a hex color string (#RRGGBB) to HSL string "H S% L%"
 * matching the format used by the CSS variables in globals.css.
 */
function hexToHslString(hex: string): string | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Generates a foreground-safe HSL based on luminance contrast.
 */
function getForegroundHsl(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0 0% 100%';
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '240 10% 12%' : '0 0% 100%';
}

interface BrandContextValue {
    logoUrl: string | null;
    orgName: string;
}

const BrandContext = createContext<BrandContextValue>({ logoUrl: null, orgName: '' });

export function useBrand() {
    return useContext(BrandContext);
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [orgName, setOrgName] = useState('');

    useEffect(() => {
        async function applyBranding() {
            try {
                const res = await fetch('/api/v1/settings');
                if (!res.ok) return;
                const json = await res.json();
                const data = json.data;

                // Apply primary color as CSS variable
                const color = data?.primaryColor;
                if (color && typeof color === 'string') {
                    const hsl = hexToHslString(color);
                    if (hsl) {
                        document.documentElement.style.setProperty('--primary', hsl);
                        document.documentElement.style.setProperty('--ring', hsl);
                        document.documentElement.style.setProperty('--primary-foreground', getForegroundHsl(color));
                    }
                }

                // Set logo and org name for sidebar
                if (data?.logoUrl) setLogoUrl(data.logoUrl);
                if (data?.orgName) setOrgName(data.orgName);
            } catch {
                // Silently fall back to defaults
            }
        }
        applyBranding();
    }, []);

    return (
        <BrandContext.Provider value={{ logoUrl, orgName }}>
            {children}
        </BrandContext.Provider>
    );
}
