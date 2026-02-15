import { useState, useEffect, useCallback } from 'react';

const SIDEBAR_KEY = 'designient-sidebar-collapsed';

function getStoredState(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    return stored === 'true';
  }
  return false;
}

export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(getStoredState);

  const toggle = useCallback(() => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem(SIDEBAR_KEY, String(newState));
      return newState;
    });
  }, []);

  const collapse = useCallback(() => {
    setIsCollapsed(true);
    localStorage.setItem(SIDEBAR_KEY, 'true');
  }, []);

  const expand = useCallback(() => {
    setIsCollapsed(false);
    localStorage.setItem(SIDEBAR_KEY, 'false');
  }, []);

  // Keyboard shortcut: Cmd+B or Ctrl+B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return { isCollapsed, toggle, collapse, expand };
}