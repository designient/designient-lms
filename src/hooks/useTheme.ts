'use client';

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export const THEME_KEY = 'designient-theme';
const AUTO_LIGHT_START_HOUR = 7;
const AUTO_DARK_START_HOUR = 19;

function getTimeBasedTheme(): 'light' | 'dark' {
    const hour = new Date().getHours();
    return hour >= AUTO_LIGHT_START_HOUR && hour < AUTO_DARK_START_HOUR
        ? 'light'
        : 'dark';
}

function getStoredTheme(): Theme {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
            return stored;
        }
    }
    return 'system';
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
    return theme === 'system' ? getTimeBasedTheme() : theme;
}

function applyTheme(theme: Theme) {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const effectiveTheme = resolveTheme(theme);

    root.classList.toggle('dark', effectiveTheme === 'dark');

    root.dataset.theme = theme;
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(getStoredTheme()));

    useEffect(() => {
        applyTheme(theme);
        setResolvedTheme(resolveTheme(theme));
    }, [theme]);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        if (typeof window !== 'undefined') {
            localStorage.setItem(THEME_KEY, newTheme);
        }
    }, []);

    useEffect(() => {
        if (theme !== 'system') return;

        const syncAutoTheme = () => {
            applyTheme('system');
            setResolvedTheme(getTimeBasedTheme());
        };

        syncAutoTheme();

        const autoSyncInterval = window.setInterval(syncAutoTheme, 60_000);
        window.addEventListener('focus', syncAutoTheme);

        const handleVisibilityChange = () => {
            if (!document.hidden) syncAutoTheme();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.clearInterval(autoSyncInterval);
            window.removeEventListener('focus', syncAutoTheme);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [theme]);

    return { theme, setTheme, resolvedTheme };
}

export function initializeTheme() {
    const theme = getStoredTheme();
    applyTheme(theme);
}
