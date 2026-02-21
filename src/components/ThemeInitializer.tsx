'use client';

import { useEffect } from 'react';
import { initializeTheme, THEME_KEY } from '@/hooks/useTheme';

export function ThemeInitializer() {
    useEffect(() => {
        const syncTheme = () => initializeTheme();

        syncTheme();

        const intervalId = window.setInterval(syncTheme, 60_000);
        window.addEventListener('focus', syncTheme);

        const handleVisibilityChange = () => {
            if (!document.hidden) syncTheme();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        const handleStorage = (event: StorageEvent) => {
            if (event.key === THEME_KEY) syncTheme();
        };
        window.addEventListener('storage', handleStorage);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('focus', syncTheme);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    return null;
}
