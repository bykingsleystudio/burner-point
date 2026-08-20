'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference !== 'system') return preference;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>('system');

  const syncThemeColor = (resolvedTheme: 'light' | 'dark') => {
    if (typeof document === 'undefined') return;

    document.documentElement.dataset.theme = resolvedTheme;

    const themeMeta = document.head.querySelector('meta[name="theme-color"]') ?? document.createElement('meta');
    themeMeta.setAttribute('name', 'theme-color');
    themeMeta.setAttribute('content', resolvedTheme === 'dark' ? '#000000' : '#F3F8F5');

    if (!themeMeta.parentElement) {
      document.head.appendChild(themeMeta);
    }
  };

  useEffect(() => {
    const saved = window.localStorage.getItem('burnerpoint-theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      setPreference(saved);
    }
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      const resolvedTheme = resolveTheme(preference);
      syncThemeColor(resolvedTheme);
    };

    applyTheme();
    if (preference !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [preference]);

  const updatePreference = (nextPreference: ThemePreference) => {
    window.localStorage.setItem('burnerpoint-theme', nextPreference);
    setPreference(nextPreference);
  };

  return (
    <ThemeContext.Provider value={{ preference, setPreference: updatePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}