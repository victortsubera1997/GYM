import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const ThemeModeContext = createContext();

export function ThemeProvider({ children }) {
  const getInitialMode = () => {
    if (typeof window !== 'undefined') {
      const ls = window.localStorage.getItem('theme-mode');
      if (ls) return ls;
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  };

  const [mode, setMode] = useState();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMode(getInitialMode());
    setReady(true);
  }, []);

  const toggleTheme = () => {
    setMode(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem('theme-mode', next);
      return next;
    });
  };

  const value = useMemo(() => ({ mode, toggleTheme }), [mode]);
  if (!ready || !mode) return null; // <--- не рендеримо нічого, поки не готово

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeModeContext);
}