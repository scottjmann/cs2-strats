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
          primary: '#13161f',
          surface: '#1b2030',
          elevated: '#242c40',
        },
        border: {
          dim: '#303a52',
          base: '#3f4d6a',
          bright: '#f59e0b',
        },
        accent: {
          DEFAULT: '#f59e0b',
          dim: '#b45309',
        },
        ct: '#3b82f6',
        t: '#ef4444',
        smoke: '#6b7280',
        flash: '#eab308',
        molotov: '#f97316',
        he: '#22c55e',
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
        tile: '0 0 0 1px rgba(245,158,11,0), inset 0 0 30px rgba(0,0,0,0.6)',
        'tile-hover': '0 0 0 1px rgba(245,158,11,0.6), 0 0 20px rgba(245,158,11,0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
