import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:  'rgb(var(--color-bg-primary)  / <alpha-value>)',
          surface:  'rgb(var(--color-bg-surface)  / <alpha-value>)',
          elevated: 'rgb(var(--color-bg-elevated) / <alpha-value>)',
        },
        border: {
          dim:    'rgb(var(--color-border-dim)    / <alpha-value>)',
          base:   'rgb(var(--color-border-base)   / <alpha-value>)',
          bright: 'rgb(var(--color-border-bright) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent)     / <alpha-value>)',
          dim:     'rgb(var(--color-accent-dim)  / <alpha-value>)',
        },
        ct:      'rgb(var(--color-ct) / <alpha-value>)',
        t:       'rgb(var(--color-t)  / <alpha-value>)',
        smoke:   '#6b7280',
        flash:   '#eab308',
        molotov: '#f97316',
        he:      '#22c55e',
      },
      fontFamily: {
        heading: ['var(--font-rajdhani)', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-in-out',
      },
      boxShadow: {
        tile: '0 0 0 1px rgb(var(--color-accent) / 0), inset 0 0 30px rgba(0,0,0,0.6)',
        'tile-hover': '0 0 0 1px rgb(var(--color-accent) / 0.6), 0 0 20px rgb(var(--color-accent) / 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
