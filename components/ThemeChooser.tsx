'use client';

import { useState } from 'react';
import { useTheme, THEMES } from './ThemeProvider';

export function ThemeChooser() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const active = THEMES.find(t => t.id === theme)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title="Change theme"
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm border border-border-dim hover:border-accent/50 text-zinc-400 hover:text-accent transition-colors"
      >
        {/* Palette icon */}
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10 1.1 0 2-.9 2-2v-.5c0-.55.45-1 1-1h1c3.31 0 6-2.69 6-6C22 6.48 17.52 2 12 2z" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="7" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="9" cy="8" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="15" cy="8" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="17" cy="12" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <span className="font-heading text-[10px] uppercase tracking-wider hidden sm:block">
          {active.label}
        </span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Popover */}
          <div className="absolute right-0 top-full mt-1.5 z-50 bg-bg-surface border border-border-dim rounded-sm shadow-lg overflow-hidden min-w-[160px]">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                className={[
                  'w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left',
                  theme === t.id
                    ? 'bg-accent/10 text-accent'
                    : 'text-zinc-300 hover:bg-bg-elevated',
                ].join(' ')}
              >
                {/* Swatch */}
                <div className="flex-shrink-0 w-6 h-6 rounded-sm border border-white/10 overflow-hidden flex items-center justify-center"
                  style={{ background: t.bg }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.accent }} />
                </div>
                <div>
                  <p className="font-heading text-xs uppercase tracking-wider leading-none">{t.label}</p>
                  {t.jp && <p className="text-[10px] text-zinc-500 mt-0.5">{t.jp}</p>}
                </div>
                {theme === t.id && (
                  <svg className="ml-auto w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
