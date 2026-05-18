import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CS2 Strats',
  description: 'Smoke lineups, flash setups, and team strats for CS2.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg-primary font-body antialiased">
        {children}
      </body>
    </html>
  );
}
