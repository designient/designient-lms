'use client';

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'designient-theme';

function getSystemTheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    }
    return 'light';
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

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;

    if (effectiveTheme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>('system');
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    // Initialize on mount
    useEffect(() => {
        const stored = getStoredTheme();
        setThemeState(stored);
        setResolvedTheme(stored === 'system' ? getSystemTheme() : stored as 'light' | 'dark');
        applyTheme(stored);
    }, []);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
        applyTheme(newTheme);
        setResolvedTheme(newTheme === 'system' ? getSystemTheme() : newTheme);
    }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'system') {
                applyTheme('system');
                setResolvedTheme(getSystemTheme());
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    return { theme, setTheme, resolvedTheme };
}

export function initializeTheme() {
    const theme = getStoredTheme();
    applyTheme(theme);
}
