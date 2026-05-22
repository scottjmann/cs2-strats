'use client';

import { use, useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Side, UtilityEntry } from '@/lib/types';
import MapView from '@/components/MapView';
import { ThemeChooser } from '@/components/ThemeChooser';
import { AdminLogin, clearAdminSession } from '@/components/AdminLogin';
import { AdminPanel } from '@/components/AdminPanel';
import type { PickMode } from '@/components/AdminEntryForm';
import { fetchMapEntries } from '@/lib/supabase';

import dust2 from '@/data/de_dust2';

const MAP_DATA = { de_dust2: dust2 } as const;

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MapPage({ params }: { params: Promise<{ mapId: string }> }) {
  const { mapId } = use(params);
  const map = MAP_DATA[mapId as keyof typeof MAP_DATA];

  if (!map) notFound();

  const [side, setSide]               = useState<Side | null>(null);
  const [mapFocusId, setMapFocusId]   = useState<string | null>(null);

  // Admin state
  const [isAdmin, setIsAdmin]         = useState(false);
  const [showLogin, setShowLogin]     = useState(false);
  const [mapActiveId, setMapActiveId] = useState<string | null>(null);
  const [pickMode, setPickMode]       = useState<PickMode>(null);
  const [pickedFrom, setPickedFrom]   = useState<{ x: number; y: number } | null>(null);
  const [pickedTo, setPickedTo]       = useState<{ x: number; y: number } | null>(null);
  const [dbEntries, setDbEntries]     = useState<UtilityEntry[]>([]);

  useEffect(() => {
    setIsAdmin(localStorage.getItem('cs2-admin-token') === 'cs2-admin-session');
    fetchMapEntries(mapId).then(setDbEntries);
  }, [mapId]);

  function handleInitCoords(from: { x: number; y: number } | null, to: { x: number; y: number } | null) {
    setPickedFrom(from);
    setPickedTo(to);
    setPickMode(null);
  }

  function handleSaved() {
    fetchMapEntries(mapId).then(setDbEntries);
  }

  // ── Side picker ────────────────────────────────────────────────────────────
  if (!side) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <header className="relative z-30 border-b border-border-dim bg-bg-surface/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
            <Link
              href="/"
              className="text-zinc-400 hover:text-white transition-colors text-xs font-heading uppercase tracking-widest flex items-center gap-1.5"
            >
              <span>←</span>
              <span>Maps</span>
            </Link>
            <span className="text-border-dim">/</span>
            <span className="font-heading font-bold text-sm uppercase tracking-[0.2em] text-white">
              {map.name}
            </span>
            <div className="ml-auto"><ThemeChooser /></div>
          </div>
        </header>

        <div className="flex flex-1 relative">
          {/* CT — coming soon */}
          <div className="flex-1 flex flex-col items-center justify-center gap-5 border-r border-border-dim relative overflow-hidden opacity-40 cursor-not-allowed">
            <div className="absolute inset-0 bg-cover bg-center opacity-25"
              style={{ backgroundImage: 'url(/images/Chooseteam_CT.webp)' }} />
            <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/40 via-transparent to-bg-primary/70" />
            <span className="relative font-heading font-black text-[clamp(72px,12vw,140px)] leading-none text-ct/40 select-none">
              CT
            </span>
            <div className="relative flex flex-col items-center gap-1.5">
              <span className="font-heading text-sm uppercase tracking-[0.3em] text-zinc-500">
                Counter-Terrorist
              </span>
              <span className="font-heading text-xs uppercase tracking-widest text-zinc-600 border border-border-dim px-2 py-0.5 rounded-sm">
                Coming Soon
              </span>
            </div>
          </div>

          {/* T */}
          <button
            onClick={() => setSide('T')}
            className="flex-1 flex flex-col items-center justify-center gap-5 bg-t/[0.04] hover:bg-t/[0.10] transition-colors group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-cover bg-center opacity-25 group-hover:opacity-40 transition-opacity"
              style={{ backgroundImage: 'url(/images/Chooseteam_Terror.webp)' }} />
            <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/40 via-transparent to-bg-primary/70" />
            <span className="relative font-heading font-black text-[clamp(72px,12vw,140px)] leading-none text-t/40 group-hover:text-t/70 transition-colors select-none">
              T
            </span>
            <span className="relative font-heading text-sm uppercase tracking-[0.3em] text-zinc-500 group-hover:text-t transition-colors">
              Terrorist
            </span>
          </button>
        </div>
      </div>
    );
  }

  // ── Map view ───────────────────────────────────────────────────────────────
  // DB entries take precedence — allows editing hardcoded entries via admin
  const dbIds = new Set(dbEntries.map(e => e.id));
  const allEntries = [...map.utility.filter(e => !dbIds.has(e.id)), ...dbEntries];
  const utility = allEntries.filter((u) => u.side === side);

  const bgImage = side === 'CT' ? '/images/CT-full.webp' : '/images/T-full.webp';

  return (
    <div className="relative min-h-screen bg-bg-primary">
      {showLogin && (
        <AdminLogin
          onLogin={() => { setIsAdmin(true); setShowLogin(false); }}
          onClose={() => setShowLogin(false)}
        />
      )}
      <div
        key={bgImage}
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-top animate-fade-in"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-bg-primary/20 via-bg-primary/70 to-bg-primary" />

      <header className="sticky top-0 z-30 border-b border-border-dim bg-bg-surface/90 backdrop-blur-sm">
        <div className="px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="text-zinc-400 hover:text-white transition-colors text-xs font-heading uppercase tracking-widest flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Maps</span>
          </Link>
          <span className="text-border-dim">/</span>
          <button
            onClick={() => setSide(null)}
            className="font-heading font-bold text-sm uppercase tracking-[0.2em] text-white hover:text-zinc-400 transition-colors"
          >
            {map.name}
          </button>

          <ThemeChooser />

          {/* Side toggle */}
          <div className="ml-auto flex rounded-sm overflow-hidden border border-border-dim">
            <button
              onClick={() => setSide('CT')}
              className={[
                'px-4 py-1.5 text-xs font-heading font-bold uppercase tracking-wider transition-colors',
                side === 'CT' ? 'bg-ct text-white' : 'text-zinc-400 hover:text-ct',
              ].join(' ')}
            >
              CT
            </button>
            <div className="w-px bg-border-dim" />
            <button
              onClick={() => setSide('T')}
              className={[
                'px-4 py-1.5 text-xs font-heading font-bold uppercase tracking-wider transition-colors',
                side === 'T' ? 'bg-t text-white' : 'text-zinc-400 hover:text-t',
              ].join(' ')}
            >
              T
            </button>
          </div>

          {/* Admin controls */}
          {isAdmin ? (
            <button
              onClick={() => { clearAdminSession(); setIsAdmin(false); setPickMode(null); setPickedFrom(null); setPickedTo(null); }}
              className="text-zinc-600 hover:text-zinc-400 transition-colors text-[10px] font-heading uppercase tracking-wider"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="text-zinc-500 hover:text-zinc-200 transition-colors"
              title="Admin login"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
              </svg>
            </button>
          )}
        </div>
      </header>

      <div className="relative z-10 px-4 h-[calc(100vh-3.5rem)] py-3 overflow-x-auto overflow-y-hidden">
        <div className="w-fit mx-auto h-full">
        <MapView
          entries={utility}
          overviewImage={map.overviewImage ?? ''}
          autoTriggerEntryId={mapFocusId}
          onAutoTriggered={() => setMapFocusId(null)}
          pickMode={pickMode}
          onCoordPicked={(coords) => {
            if (pickMode === 'from') { setPickedFrom(coords); setPickMode(null); }
            else if (pickMode === 'to') { setPickedTo(coords); setPickMode(null); }
          }}
          pickedFrom={pickedFrom}
          pickedTo={pickedTo}
          onActiveChange={setMapActiveId}
          adminPanel={
            <AdminPanel
              entries={utility}
              mapId={mapId}
              side={side}
              pickMode={pickMode}
              pickedFrom={pickedFrom}
              pickedTo={pickedTo}
              onSetPickMode={setPickMode}
              onInitCoords={handleInitCoords}
              onSaved={handleSaved}
              onTriggerMap={setMapFocusId}
              activeEntryId={mapActiveId}
              isAdmin={isAdmin}
            />
          }
        />
        </div>
      </div>
    </div>
  );
}
