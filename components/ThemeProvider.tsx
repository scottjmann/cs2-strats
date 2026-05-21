'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'default' | 'edo' | 'meiji' | 'taisho';

export const THEME_VARS: Record<Theme, Record<string, string>> = {
  default: {
    '--color-page-bg':       '9 11 14',
    '--color-bg-primary':    '19 22 31',
    '--color-bg-surface':    '27 32 48',
    '--color-bg-elevated':   '36 44 64',
    '--color-border-dim':    '48 58 82',
    '--color-border-base':   '63 77 106',
    '--color-border-bright': '245 158 11',
    '--color-accent':        '245 158 11',
    '--color-accent-dim':    '180 83 9',
    '--color-ct':            '59 130 246',
    '--color-t':             '239 68 68',
  },
  // Edo — deep indigo navy, burnished gold accent (納戸色 × 卵色)
  edo: {
    '--color-page-bg':       '6 8 20',
    '--color-bg-primary':    '10 12 30',
    '--color-bg-surface':    '16 20 48',
    '--color-bg-elevated':   '24 30 66',
    '--color-border-dim':    '38 46 100',
    '--color-border-base':   '58 70 140',
    '--color-border-bright': '220 174 72',
    '--color-accent':        '220 174 72',
    '--color-accent-dim':    '160 120 40',
    '--color-ct':            '52 160 200',
    '--color-t':             '220 110 50',
  },
  // Meiji — rich amber dusk, deep charcoal, lacquer red (柿色 × 杏子)
  meiji: {
    '--color-page-bg':       '14 8 4',
    '--color-bg-primary':    '22 14 8',
    '--color-bg-surface':    '36 22 10',
    '--color-bg-elevated':   '52 32 14',
    '--color-border-dim':    '78 50 22',
    '--color-border-base':   '110 72 32',
    '--color-border-bright': '244 138 40',
    '--color-accent':        '244 138 40',
    '--color-accent-dim':    '172 88 22',
    '--color-ct':            '72 162 124',
    '--color-t':             '210 64 36',
  },
  // Taisho — moonlit teal, verdigris, pale celadon (水色 × 空色)
  taisho: {
    '--color-page-bg':       '4 12 14',
    '--color-bg-primary':    '6 18 22',
    '--color-bg-surface':    '10 28 34',
    '--color-bg-elevated':   '14 40 48',
    '--color-border-dim':    '22 64 76',
    '--color-border-base':   '34 90 108',
    '--color-border-bright': '96 210 200',
    '--color-accent':        '96 210 200',
    '--color-accent-dim':    '56 148 138',
    '--color-ct':            '100 158 220',
    '--color-t':             '200 168 90',
  },
};

export const THEMES: { id: Theme; label: string; jp: string; accent: string; bg: string }[] = [
  { id: 'default', label: 'Default', jp: '',     accent: '#f59e0b', bg: '#13161f' },
  { id: 'edo',     label: 'Edo',     jp: '江戸', accent: '#dcae48', bg: '#0a0c1e' },
  { id: 'meiji',   label: 'Meiji',   jp: '明治', accent: '#f48a28', bg: '#160e06' },
  { id: 'taisho',  label: 'Taisho',  jp: '大正', accent: '#60d2c8', bg: '#061216' },
];

function applyTheme(t: Theme) {
  const root = document.documentElement;
  const vars = THEME_VARS[t];
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }
}

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'default',
  setTheme: () => {},
});

export function useTheme() { return useContext(ThemeContext); }

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('default');

  useEffect(() => {
    const saved = localStorage.getItem('cs2-theme') as Theme | null;
    const t = saved && THEME_VARS[saved] ? saved : 'default';
    setThemeState(t);
    applyTheme(t);
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem('cs2-theme', t);
    applyTheme(t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
