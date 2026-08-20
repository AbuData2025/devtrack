import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({});

export const THEMES = {
  dark: {
    bg: '#080810',
    bg2: '#0d0d1a',
    bg3: '#111120',
    border: '#1e2035',
    cyan: '#06b6d4',
    cyanLight: '#22d3ee',
    green: '#10b981',
    amber: '#f5a623',
    red: '#e85555',
    blue: '#4a9ef5',
    purple: '#818cf8',
    text: '#f0f0ff',
    text2: '#8888a8',
    text3: '#4a4a6a',
    cardShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  light: {
    bg: '#f4f5f7',
    bg2: '#ffffff',
    bg3: '#f0f1f5',
    border: '#e2e4ea',
    cyan: '#0891b2',
    cyanLight: '#06b6d4',
    green: '#059669',
    amber: '#d97706',
    red: '#dc2626',
    blue: '#2563eb',
    purple: '#7c3aed',
    text: '#0f0f1a',
    text2: '#4a4a6a',
    text3: '#9898b0',
    cardShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('devtrack_theme') || 'dark');
  const theme = THEMES[mode];

  useEffect(() => {
    localStorage.setItem('devtrack_theme', mode);
    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = theme.text;
  }, [mode]);

  const toggle = () => setMode(m => m === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);