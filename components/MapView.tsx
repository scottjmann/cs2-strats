'use client';

import { useState, useEffect, useRef } from 'react';
import type { UtilityEntry } from '@/lib/types';
import { getVideoId } from '@/lib/youtube';

interface Props {
  entries: UtilityEntry[];
  overviewImage: string;
  autoTriggerEntryId?: string | null;
  onAutoTriggered?: () => void;
}

// ── Timing constants ──────────────────────────────────────────────────────────
const TRAVEL       = 1750;
const BOUNCE_TOTAL = 560 + 380 + 220;
const BLOOM_EXPAND = 900;
const BLOOM_SIT    = 3000;
const BLOOM_FADE   = 600;
const PAUSE  = BOUNCE_TOTAL + BLOOM_EXPAND + BLOOM_SIT + BLOOM_FADE;
const CYCLE  = TRAVEL + PAUSE;

// ── Bloom rings ───────────────────────────────────────────────────────────────
const BLOOM_RINGS = [
  { size: 77, stagger:   0, dx:   0, dy:   0 },
  { size: 63, stagger: 110, dx: -14, dy:   8 },
  { size: 70, stagger: 200, dx:  12, dy:  -7 },
  { size: 53, stagger: 310, dx:  -8, dy: -10 },
];

function getRingStyle(landElapsed: number, stagger: number) {
  const MAX_OPACITY = 0.94;
  const start = BOUNCE_TOTAL + stagger;
  if (landElapsed < start) return null;
  const e = landElapsed - start;
  if (e < BLOOM_EXPAND) {
    const p = e / BLOOM_EXPAND;
    return { scale: 1 - Math.pow(1 - p, 2), opacity: p * MAX_OPACITY };
  }
  const afterExpand = e - BLOOM_EXPAND;
  if (afterExpand < BLOOM_SIT)    return { scale: 1, opacity: MAX_OPACITY };
  const afterSit = afterExpand - BLOOM_SIT;
  if (afterSit < BLOOM_FADE)      return { scale: 1, opacity: MAX_OPACITY * (1 - afterSit / BLOOM_FADE) };
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function computeArc(entry: UtilityEntry) {
  const f = entry.fromCoords!;
  const t = entry.toCoords!;
  const dx = t.x - f.x, dy = t.y - f.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const bulge = len * 0.35;
  const mx = (f.x + t.x) / 2, my = (f.y + t.y) / 2;
  const opt1y = my + (dx / len) * bulge;
  const opt2y = my + (-dx / len) * bulge;
  const [cx, cy] = opt1y < opt2y
    ? [mx + (-dy / len) * bulge, opt1y]
    : [mx + (dy / len) * bulge, opt2y];
  return { f, t, cx, cy };
}

function quadBezier(t: number, p0: number, p1: number, p2: number) {
  return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
}

// ── PinDot ────────────────────────────────────────────────────────────────────
function PinDot({ x, y, type, dimmed, highlighted, onMouseEnter, onMouseLeave, onClick }: {
  x: number; y: number; type: 'from' | 'to';
  dimmed: boolean; highlighted: boolean;
  onMouseEnter: () => void; onMouseLeave: () => void; onClick: () => void;
}) {
  const isFrom    = type === 'from';
  const color     = isFrom ? '#f59e0b' : '#ef4444';
  const glowColor = isFrom ? 'rgba(245,158,11,0.65)' : 'rgba(239,68,68,0.65)';
  const spotColor = isFrom ? 'rgba(255,228,140,0.9)' : 'rgba(255,180,180,0.9)';
  return (
    <div data-pin="true" className="absolute cursor-pointer" style={{
      left: `${x}%`, top: `${y}%`,
      transform: `translate(-50%, -50%) scale(${highlighted ? 1.45 : 1})`,
      opacity: dimmed ? 0.75 : 1,
      transition: 'opacity 0.15s, transform 0.15s',
      zIndex: highlighted ? 15 : 10,
    }} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>
      {highlighted && (
        <div className="absolute rounded-full animate-ping"
          style={{ inset: '-5px', background: glowColor, borderRadius: '50%' }} />
      )}
      <div className="w-4 h-4 rounded-full relative" style={{
        background: `radial-gradient(circle at 33% 28%, ${spotColor} 0%, ${color} 48%, ${color}bb 100%)`,
        boxShadow: highlighted
          ? `0 0 10px 4px ${glowColor}, 0 0 3px 1px ${color}`
          : `0 0 5px 2px ${glowColor}60`,
        border: `1.5px solid ${color}`,
      }}>
        <div className="absolute rounded-full"
          style={{ width: '32%', height: '32%', top: '14%', left: '16%', background: 'rgba(255,255,255,0.72)' }} />
      </div>
    </div>
  );
}

// ── MapView ───────────────────────────────────────────────────────────────────
interface IconState {
  x: number; y: number; rotation: number; bobbleY: number; landElapsed: number;
}

export default function MapView({ entries, overviewImage, autoTriggerEntryId, onAutoTriggered }: Props) {
  const [hoveredId, setHoveredId]   = useState<string | null>(null);
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [showGrid, setShowGrid]     = useState(false);
  const [iconState, setIconState]   = useState<IconState | null>(null);
  const [animTrigger, setAnimTrigger] = useState<{ id: string; nonce: number } | null>(null);

  // Refs so rAF closure can read current values without stale captures
  const hoveredIdRef  = useRef<string | null>(null);
  const activeIdRef   = useRef<string | null>(null);
  const animRef       = useRef<number | null>(null);
  const bloomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pinEntries  = entries.filter(e => e.fromCoords && e.toCoords && e.videoUrl);
  const activeEntry = pinEntries.find(e => e.id === activeId) ?? null;
  const videoId     = activeEntry ? getVideoId(activeEntry.videoUrl) : null;

  // Keep refs in sync
  useEffect(() => { hoveredIdRef.current = hoveredId; }, [hoveredId]);
  useEffect(() => { activeIdRef.current  = activeId;  }, [activeId]);

  // Animation loop — triggered by animTrigger, runs to completion before stopping
  useEffect(() => {
    if (!animTrigger) { setIconState(null); return; }
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const { id } = animTrigger;
    const entry = entries.find(e => e.id === id && e.fromCoords && e.toCoords);
    if (!entry) { setIconState(null); return; }

    const { f, t, cx, cy } = computeArc(entry);
    let cycleStart: number | null = null;

    function animate(timestamp: number) {
      if (cycleStart === null) cycleStart = timestamp;
      const elapsed = timestamp - cycleStart;

      if (elapsed >= CYCLE) {
        const shouldLoop = hoveredIdRef.current === id || activeIdRef.current === id;
        if (shouldLoop) {
          cycleStart = timestamp;
          animRef.current = requestAnimationFrame(animate);
        } else {
          setIconState(null);
        }
        return;
      }

      if (elapsed < TRAVEL) {
        const tVal = elapsed / TRAVEL;
        setIconState({
          x: quadBezier(tVal, f.x, cx, t.x),
          y: quadBezier(tVal, f.y, cy, t.y),
          rotation: tVal * 720,
          bobbleY: 0,
          landElapsed: -1,
        });
      } else {
        const landElapsed = elapsed - TRAVEL;
        const bounces = [
          { height: 10,  duration: 560 },
          { height: 2.5, duration: 380 },
          { height: 0.8, duration: 220 },
        ];
        let remaining = landElapsed, bobbleY = 0;
        for (const b of bounces) {
          if (remaining < b.duration) {
            const p = remaining / b.duration;
            bobbleY = -4 * b.height * p * (1 - p);
            break;
          }
          remaining -= b.duration;
        }
        setIconState({
          x: t.x, y: t.y,
          rotation: 720 + (landElapsed / PAUSE) * 90,
          bobbleY,
          landElapsed,
        });
      }
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [animTrigger, entries]);

  // Auto-trigger from list view "View on Map" button
  useEffect(() => {
    if (!autoTriggerEntryId) return;
    if (bloomTimerRef.current) clearTimeout(bloomTimerRef.current);
    // Clear any previous active selection so video panel starts hidden
    setActiveId(null);
    activeIdRef.current = null;
    setAnimTrigger(prev => ({ id: autoTriggerEntryId, nonce: prev?.id === autoTriggerEntryId ? (prev.nonce + 1) : 0 }));
    // Activate video panel exactly when bloom starts
    bloomTimerRef.current = setTimeout(() => {
      setActiveId(autoTriggerEntryId);
      activeIdRef.current = autoTriggerEntryId;
    }, TRAVEL + BOUNCE_TOTAL);
    onAutoTriggered?.();
    return () => { if (bloomTimerRef.current) clearTimeout(bloomTimerRef.current); };
  }, [autoTriggerEntryId]);

  function triggerAnim(id: string) {
    setAnimTrigger(prev => ({ id, nonce: prev?.id === id ? (prev.nonce + 1) : 0 }));
  }

  function handleMouseEnter(id: string) {
    setHoveredId(id);
    hoveredIdRef.current = id;
  }

  function handleMouseLeave() {
    setHoveredId(null);
    hoveredIdRef.current = null;
    // animation keeps running — completes current cycle then stops
  }

  function handleClick(id: string) {
    if (bloomTimerRef.current) { clearTimeout(bloomTimerRef.current); bloomTimerRef.current = null; }
    const next = activeId === id ? null : id;
    setActiveId(next);
    activeIdRef.current = next;
    if (next) triggerAnim(id);
  }

  return (
    <div className="flex gap-4 items-start justify-center h-full">

      {/* ── Map column — height-driven so no scrolling ── */}
      <div className="relative rounded-sm overflow-hidden select-none flex-shrink-0"
        style={{ height: '100%' }}
        onClick={(e) => {
          const el = e.target as HTMLElement;
          if (!el.closest('[data-pin]')) { setActiveId(null); activeIdRef.current = null; }
        }}
      >
        <img src={overviewImage} alt="Map overview" className="h-full w-auto block" draggable={false} />

        {/* Grid toggle */}
        <button
          onClick={() => setShowGrid(g => !g)}
          className={[
            'absolute top-2 right-2 z-30 px-2 py-1 rounded-sm border font-heading text-[10px] uppercase tracking-wider transition-colors',
            showGrid ? 'bg-accent text-white border-accent' : 'bg-bg-surface/80 text-zinc-400 border-border-dim hover:text-accent hover:border-accent',
          ].join(' ')}
        >
          Grid
        </button>

        {/* Grid overlay */}
        {showGrid && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 25 }}>
            {Array.from({ length: 11 }, (_, i) => i * 10).map(v => (
              <g key={v}>
                <line x1={v} y1={0} x2={v} y2={100} stroke="rgba(255,255,0,0.35)" strokeWidth="0.3" />
                <line x1={0} y1={v} x2={100} y2={v} stroke="rgba(255,255,0,0.35)" strokeWidth="0.3" />
              </g>
            ))}
          </svg>
        )}
        {showGrid && Array.from({ length: 11 }, (_, i) => i * 10).map(v => (
          <div key={`lbl-${v}`} className="absolute pointer-events-none" style={{ zIndex: 26 }}>
            <span className="absolute text-[9px] font-mono text-yellow-300 leading-none"
              style={{ left: `${v}%`, top: '2px', transform: 'translateX(-50%)' }}>{v}</span>
            <span className="absolute text-[9px] font-mono text-yellow-300 leading-none"
              style={{ top: `${v}%`, left: '2px', transform: 'translateY(-50%)' }}>{v}</span>
          </div>
        ))}

        {/* Arc SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {pinEntries.map(entry => {
            const show = hoveredId === entry.id || activeId === entry.id || animTrigger?.id === entry.id;
            if (!show) return null;
            const { f, t, cx, cy } = computeArc(entry);
            return <path key={entry.id} d={`M ${f.x} ${f.y} Q ${cx} ${cy} ${t.x} ${t.y}`}
              fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.35" />;
          })}
        </svg>

        {/* Smoke bloom */}
        {iconState && iconState.landElapsed >= 0 && BLOOM_RINGS.map((r, i) => {
          const rs = getRingStyle(iconState.landElapsed, r.stagger);
          if (!rs) return null;
          return (
            <div key={i} className="absolute pointer-events-none rounded-full" style={{
              left: `${iconState.x}%`, top: `${iconState.y}%`,
              width: `${r.size}px`, height: `${r.size}px`,
              transform: `translate(calc(-50% + ${r.dx}px), calc(-50% + ${r.dy}px)) scale(${rs.scale})`,
              opacity: rs.opacity,
              background: 'radial-gradient(circle, rgba(165,165,170,0.98) 0%, rgba(140,140,145,0.7) 50%, transparent 78%)',
              zIndex: 20,
            }} />
          );
        })}

        {/* Grenade icon */}
        {iconState && iconState.landElapsed < BOUNCE_TOTAL && (
          <img src="/images/smoke-grenade-icon.webp" alt="" className="absolute pointer-events-none"
            style={{
              left: `${iconState.x}%`, top: `${iconState.y}%`,
              transform: `translate(-50%, calc(-50% + ${iconState.bobbleY}px)) rotate(${iconState.rotation}deg)`,
              width: '37px', height: '37px', zIndex: 16,
            }}
          />
        )}

        {/* Pins */}
        {pinEntries.map(entry => {
          const animId = animTrigger?.id;
          const isDimmed = (hoveredId !== null && hoveredId !== entry.id) ||
            (animId != null && hoveredId === null && iconState !== null && animId !== entry.id);
          const isHighlighted = hoveredId === entry.id || activeId === entry.id || animTrigger?.id === entry.id;
          const props = {
            dimmed: isDimmed, highlighted: isHighlighted,
            onMouseEnter: () => handleMouseEnter(entry.id),
            onMouseLeave: () => handleMouseLeave(),
            onClick: () => handleClick(entry.id),
          };
          return (
            <div key={entry.id}>
              <PinDot x={entry.fromCoords!.x} y={entry.fromCoords!.y} type="from" {...props} />
              <PinDot x={entry.toCoords!.x}   y={entry.toCoords!.y}   type="to"   {...props} />
              <div
                className="absolute cursor-pointer"
                style={{
                  left: `${entry.fromCoords!.x}%`,
                  top: `${entry.fromCoords!.y}%`,
                  transform: entry.fromCoords!.y > 95
                    ? 'translate(calc(-100% - 14px), -50%)'
                    : 'translate(-50%, 14px)',
                  zIndex: 11,
                }}
                onMouseEnter={() => handleMouseEnter(entry.id)}
                onMouseLeave={() => handleMouseLeave()}
                onClick={() => handleClick(entry.id)}
              >
                <span className="font-heading text-[10px] uppercase tracking-wider text-white/80 whitespace-nowrap px-2 py-1 rounded-sm border border-border-dim bg-bg-primary/85">
                  {entry.name}
                </span>
              </div>
            </div>
          );
        })}

        {pinEntries.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-zinc-600 text-sm font-body uppercase tracking-widest">No map pins for this side yet</p>
          </div>
        )}
      </div>

      {/* ── Video panel ── */}
      <div className="w-80 flex-shrink-0 flex flex-col h-full rounded-sm border border-border-dim overflow-hidden bg-bg-primary/85">
        {activeEntry && videoId ? (
          <>
            <div className="px-3 py-2 border-b border-border-dim flex items-start justify-between gap-2 bg-bg-surface">
              <div>
                <p className="text-xs font-heading font-bold uppercase tracking-wider text-zinc-200 leading-tight">
                  {activeEntry.name}
                </p>
                <p className="text-[10px] text-zinc-500 font-body mt-0.5">
                  {activeEntry.from} → {activeEntry.to}
                </p>
              </div>
              <button onClick={() => { setActiveId(null); activeIdRef.current = null; }}
                className="text-zinc-600 hover:text-zinc-300 transition-colors mt-0.5 flex-shrink-0 text-xs">
                ✕
              </button>
            </div>
            <div className="aspect-[9/16]">
              <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
            </div>
          </>
        ) : (
          <div className="aspect-[9/16] flex flex-col items-center justify-center gap-3 text-center px-6">
            <svg className="w-8 h-8 text-zinc-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-zinc-600 text-xs font-heading uppercase tracking-widest leading-relaxed">
              Click a pin to watch the lineup
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
