import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'CS2 Utility',
  description: 'Smoke lineups and utility for CS2.',
  icons: { icon: '/images/cs2-utility-favicon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of unstyled theme on reload */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('cs2-theme');var v={'edo':{'--color-page-bg':'6 8 20','--color-bg-primary':'10 12 30','--color-bg-surface':'16 20 48','--color-bg-elevated':'24 30 66','--color-border-dim':'38 46 100','--color-border-base':'58 70 140','--color-border-bright':'220 174 72','--color-accent':'220 174 72','--color-accent-dim':'160 120 40','--color-ct':'52 160 200','--color-t':'220 110 50'},'meiji':{'--color-page-bg':'14 8 4','--color-bg-primary':'22 14 8','--color-bg-surface':'36 22 10','--color-bg-elevated':'52 32 14','--color-border-dim':'78 50 22','--color-border-base':'110 72 32','--color-border-bright':'244 138 40','--color-accent':'244 138 40','--color-accent-dim':'172 88 22','--color-ct':'72 162 124','--color-t':'210 64 36'},'taisho':{'--color-page-bg':'4 12 14','--color-bg-primary':'6 18 22','--color-bg-surface':'10 28 34','--color-bg-elevated':'14 40 48','--color-border-dim':'22 64 76','--color-border-base':'34 90 108','--color-border-bright':'96 210 200','--color-accent':'96 210 200','--color-accent-dim':'56 148 138','--color-ct':'100 158 220','--color-t':'200 168 90'}};if(t&&v[t]){var r=document.documentElement;var m=v[t];for(var k in m){r.style.setProperty(k,m[k])}}})()` }} />
      </head>
      <body className="min-h-screen bg-bg-primary font-body antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
