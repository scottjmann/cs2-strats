'use client';

import { use, useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Side, UtilityType, UtilityEntry } from '@/lib/types';
import { getVideoId, getThumbnailUrl, getFallbackThumbnailUrl } from '@/lib/youtube';
import MapView from '@/components/MapView';
import { ThemeChooser } from '@/components/ThemeChooser';

import dust2 from '@/data/de_dust2';

const MAP_DATA = { de_dust2: dust2 } as const;

const CATEGORIES: { type: UtilityType; label: string; color: string }[] = [
  { type: 'smoke',   label: 'Smokes',      color: 'text-smoke'   },
  { type: 'flash',   label: 'Flashes',     color: 'text-flash'   },
  { type: 'molotov', label: 'Molotovs',    color: 'text-molotov' },
  { type: 'he',      label: 'HE Grenades', color: 'text-he'      },
];

// ── Chevron ──────────────────────────────────────────────────────────────────

function Chevron({ open, className = '' }: { open: boolean; className?: string }) {
  return (
    <svg
      className={`w-4 h-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Video item ────────────────────────────────────────────────────────────────

function VideoItem({ entry, onViewOnMap }: { entry: UtilityEntry; onViewOnMap?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const videoId = getVideoId(entry.videoUrl);
  const hasMapPin = !!(entry.fromCoords && entry.toCoords && onViewOnMap);

  return (
    <div>
      <div className={[
        'w-full flex items-center gap-3 px-4 py-3',
        videoId ? 'cursor-pointer hover:bg-bg-elevated' : '',
      ].join(' ')}>
        {/* Thumbnail — clicking expands video */}
        <button
          onClick={() => videoId && setExpanded(!expanded)}
          className="w-24 h-[54px] flex-shrink-0 rounded-sm overflow-hidden bg-bg-elevated"
        >
          {videoId ? (
            <img
              src={getThumbnailUrl(entry.videoUrl)!}
              alt={entry.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const fb = getFallbackThumbnailUrl(entry.videoUrl);
                if (fb) e.currentTarget.src = fb;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-700 text-[10px] font-heading uppercase tracking-wider">
              No video
            </div>
          )}
        </button>

        {/* Text — clicking expands video */}
        <button
          onClick={() => videoId && setExpanded(!expanded)}
          className="flex-1 min-w-0 text-left"
        >
          <p className="text-sm font-body text-zinc-200 truncate">{entry.name}</p>
          <p className="text-xs text-zinc-500 font-body">
            {entry.from} → {entry.to}
          </p>
        </button>

        {/* Right-side controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasMapPin && (
            <button
              onClick={() => onViewOnMap!()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-accent/30 bg-accent/8 hover:bg-accent/18 hover:border-accent/55 text-accent font-heading text-[10px] uppercase tracking-wider transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Map
            </button>
          )}
          {videoId && (
            <button onClick={() => setExpanded(!expanded)}>
              <Chevron open={expanded} />
            </button>
          )}
        </div>
      </div>

      {expanded && videoId && (
        <div className="px-4 pb-4">
          <div className="aspect-video rounded-sm overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; encrypted-media"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Accordion ────────────────────────────────────────────────────────────────

function UtilityAccordion({
  label,
  color,
  entries,
  onViewOnMap,
}: {
  label: string;
  color: string;
  entries: UtilityEntry[];
  onViewOnMap: (entryId: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border-dim rounded-sm overflow-hidden bg-bg-primary/85">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-bg-surface hover:bg-bg-elevated transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`font-heading font-bold uppercase tracking-[0.15em] text-sm ${color}`}>
            {label}
          </span>
          <span className="text-zinc-600 text-xs">{entries.length}</span>
        </div>
        <Chevron open={open} />
      </button>

      {open && (
        <div className="divide-y divide-border-dim">
          {entries.length === 0 ? (
            <p className="px-4 py-6 text-center text-zinc-600 text-sm font-body">
              No lineups added yet.
            </p>
          ) : (
            entries.map((entry) => (
              <VideoItem
                key={entry.id}
                entry={entry}
                onViewOnMap={entry.fromCoords && entry.toCoords ? () => onViewOnMap(entry.id) : undefined}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MapPage({ params }: { params: Promise<{ mapId: string }> }) {
  const { mapId } = use(params);
  const map = MAP_DATA[mapId as keyof typeof MAP_DATA];

  if (!map) notFound();

  const [side, setSide] = useState<Side | null>(null);
  const [view, setView] = useState<'list' | 'map'>('map');
  const [mapFocusId, setMapFocusId] = useState<string | null>(null);

  function handleViewOnMap(entryId: string) {
    setMapFocusId(entryId);
    setView('map');
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

  // ── Utility view ───────────────────────────────────────────────────────────
  const utility = map.utility.filter((u) => u.side === side);

  const bgImage = side === 'CT' ? '/images/CT-full.webp' : '/images/T-full.webp';

  return (
    <div className="relative min-h-screen bg-bg-primary">
      {/* Character render background */}
      <div
        key={bgImage}
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-top animate-fade-in"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      {/* Gradient overlay — fades render into page background */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-bg-primary/20 via-bg-primary/70 to-bg-primary" />
      {/* Sticky header */}
      <header className="sticky top-0 z-30 border-b border-border-dim bg-bg-surface/90 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
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

          {/* View toggle */}
          <div className="ml-auto flex rounded-sm overflow-hidden border border-border-dim">
            <button
              onClick={() => setView('list')}
              className={[
                'px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider transition-colors',
                view === 'list' ? 'bg-accent text-white' : 'text-zinc-400 hover:text-accent',
              ].join(' ')}
            >
              List
            </button>
            <div className="w-px bg-border-dim" />
            <button
              onClick={() => setView('map')}
              className={[
                'px-3 py-1.5 text-xs font-heading font-bold uppercase tracking-wider transition-colors',
                view === 'map' ? 'bg-accent text-white' : 'text-zinc-400 hover:text-accent',
              ].join(' ')}
            >
              Map
            </button>
          </div>

          {/* Side toggle */}
          <div className="flex rounded-sm overflow-hidden border border-border-dim">
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
        </div>
      </header>

      {/* Content */}
      <div className={`relative z-10 px-4 ${view === 'map' ? 'h-[calc(100vh-3.5rem)] py-3 overflow-hidden' : 'py-6 pb-12 max-w-3xl mx-auto'}`}>
        {view === 'list' ? (
          <div className="space-y-2">
            {CATEGORIES.map((cat) => (
              <UtilityAccordion
                key={cat.type}
                label={cat.label}
                color={cat.color}
                entries={utility.filter((u) => u.type === cat.type)}
                onViewOnMap={handleViewOnMap}
              />
            ))}
          </div>
        ) : (
          <MapView
            entries={utility}
            overviewImage={map.overviewImage ?? ''}
            autoTriggerEntryId={mapFocusId}
            onAutoTriggered={() => setMapFocusId(null)}
          />
        )}
      </div>
    </div>
  );
}
