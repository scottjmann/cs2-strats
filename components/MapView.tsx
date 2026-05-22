'use client';

import { useState, useEffect, useRef } from 'react';
import type { UtilityEntry } from '@/lib/types';
import { getVideoId } from '@/lib/youtube';

interface Props {
  entries: UtilityEntry[];
  overviewImage: string;
  autoTriggerEntryId?: string | null;
  onAutoTriggered?: () => void;
  // Admin
  pickMode?: 'from' | 'to' | null;
  onCoordPicked?: (coords: { x: number; y: number }) => void;
  pickedFrom?: { x: number; y: number } | null;
  pickedTo?:   { x: number; y: number } | null;
  adminPanel?: React.ReactNode;
  onActiveChange?: (id: string | null) => void;
}

// ── Timing constants ──────────────────────────────────────────────────────────
const TRAVEL       = 1750;
const BOUNCE_TOTAL = 560 + 380 + 220;
const BLOOM_EXPAND = 900;
const BLOOM_SIT    = 3000;
const BLOOM_FADE   = 600;
const PAUSE  = BOUNCE_TOTAL + BLOOM_EXPAND + BLOOM_SIT + BLOOM_FADE;
const CYCLE  = TRAVEL + PAUSE;

const FLASH_EXPAND = 150;
const FLASH_SIT    = 80;
const FLASH_FADE   = 350;
const FLASH_TOTAL  = FLASH_EXPAND + FLASH_SIT + FLASH_FADE;

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

function getFlashStyle(landElapsed: number) {
  if (landElapsed < FLASH_EXPAND) {
    const p = landElapsed / FLASH_EXPAND;
    return { scale: p, opacity: p };
  }
  const afterExpand = landElapsed - FLASH_EXPAND;
  if (afterExpand < FLASH_SIT) return { scale: 1, opacity: 1 };
  const afterSit = afterExpand - FLASH_SIT;
  if (afterSit < FLASH_FADE) return { scale: 1, opacity: 1 - afterSit / FLASH_FADE };
  return null;
}

// ── Fire rings ────────────────────────────────────────────────────────────────
const FIRE_RINGS = [
  { size: 67, stagger:   0, dx:   0, dy:   0, core: true  },
  { size: 74, stagger:  55, dx:   3, dy:   2, core: false },
  { size: 54, stagger: 110, dx: -11, dy:   6, core: false },
  { size: 61, stagger: 200, dx:   9, dy:  -5, core: false },
  { size: 46, stagger: 310, dx:  -6, dy:  -8, core: false },
  { size: 40, stagger: 180, dx:   7, dy:   9, core: false },
];

// Same shape as getRingStyle but fire starts immediately on landing (no BOUNCE_TOTAL offset)
function getFireStyle(landElapsed: number, stagger: number) {
  const MAX_OPACITY = 0.93;
  if (landElapsed < stagger) return null;
  const e = landElapsed - stagger;
  if (e < BLOOM_EXPAND) {
    const p = e / BLOOM_EXPAND;
    return { scale: 1 - Math.pow(1 - p, 2), opacity: p * MAX_OPACITY };
  }
  const afterExpand = e - BLOOM_EXPAND;
  if (afterExpand < BLOOM_SIT) return { scale: 1, opacity: MAX_OPACITY };
  const afterSit = afterExpand - BLOOM_SIT;
  if (afterSit < BLOOM_FADE) return { scale: 1, opacity: MAX_OPACITY * (1 - afterSit / BLOOM_FADE) };
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

// ── Pin colours ───────────────────────────────────────────────────────────────
const PIN_COLORS: Record<string, { color: string; glowColor: string; spotColor: string }> = {
  smoke:   { color: '#f59e0b', glowColor: 'rgba(245,158,11,0.65)',  spotColor: 'rgba(255,228,140,0.9)' },
  flash:   { color: '#7dd3fc', glowColor: 'rgba(125,211,252,0.65)', spotColor: 'rgba(224,242,254,0.9)' },
  molotov: { color: '#f97316', glowColor: 'rgba(249,115,22,0.65)',  spotColor: 'rgba(254,215,170,0.9)' },
  he:      { color: '#22c55e', glowColor: 'rgba(34,197,94,0.65)',   spotColor: 'rgba(187,247,208,0.9)' },
};

const TYPE_LABELS: Record<string, string> = {
  smoke: 'Smokes', flash: 'Flashes', molotov: 'Molotovs', he: 'HE',
};

// ── PinDot ────────────────────────────────────────────────────────────────────
function PinDot({ x, y, type, utilityType = 'smoke', dimmed, highlighted, onMouseEnter, onMouseLeave, onClick }: {
  x: number; y: number; type: 'from' | 'to'; utilityType?: string;
  dimmed: boolean; highlighted: boolean;
  onMouseEnter: () => void; onMouseLeave: () => void; onClick: () => void;
}) {
  const isFrom = type === 'from';
  const { color, glowColor, spotColor } = isFrom
    ? (PIN_COLORS[utilityType] ?? PIN_COLORS.smoke)
    : { color: '#d4d8e0', glowColor: 'rgba(212,216,224,0.5)', spotColor: 'rgba(255,255,255,0.95)' };

  // "to" pins are small and hidden until the entry is active
  if (!isFrom) {
    return (
      <div data-pin="true" className="absolute pointer-events-none" style={{
        left: `${x}%`, top: `${y}%`,
        transform: `translate(-50%, -50%) scale(${highlighted ? 1.2 : 0.7})`,
        opacity: highlighted ? 1 : dimmed ? 0.2 : 0.5,
        transition: 'opacity 0.2s, transform 0.2s',
        zIndex: highlighted ? 15 : 8,
      }}>
        {highlighted && (
          <div className="absolute rounded-full animate-ping"
            style={{ inset: '-4px', background: glowColor, borderRadius: '50%' }} />
        )}
        <div className="w-3 h-3 rounded-full relative" style={{
          background: `radial-gradient(circle at 33% 28%, ${spotColor} 0%, ${color} 48%, ${color}bb 100%)`,
          boxShadow: highlighted ? `0 0 8px 3px ${glowColor}, 0 0 2px 1px ${color}` : 'none',
          border: `1px solid ${color}${highlighted ? '' : '66'}`,
        }} />
      </div>
    );
  }

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
          : 'none',
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

export default function MapView({ entries, overviewImage, autoTriggerEntryId, onAutoTriggered, pickMode, onCoordPicked, pickedFrom, pickedTo, adminPanel, onActiveChange }: Props) {
  const [hoveredId, setHoveredId]     = useState<string | null>(null);
  const [activeId, setActiveId]       = useState<string | null>(null);
  const [iconState, setIconState]     = useState<IconState | null>(null);
  const [animTrigger, setAnimTrigger] = useState<{ id: string; nonce: number } | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(() => new Set(['smoke', 'flash', 'molotov', 'he']));

  // Refs so rAF closure can read current values without stale captures
  const hoveredIdRef      = useRef<string | null>(null);
  const activeIdRef       = useRef<string | null>(null);
  const animRef           = useRef<number | null>(null);
  const onActiveChangeRef = useRef(onActiveChange);
  useEffect(() => { onActiveChangeRef.current = onActiveChange; }, [onActiveChange]);

  const pinEntries      = entries.filter(e => e.fromCoords && e.toCoords && e.videoUrl);
  const availableTypes  = [...new Set(pinEntries.map(e => e.type))];
  const filteredPinEntries = pinEntries.filter(e => activeFilters.has(e.type));
  const activeEntry     = filteredPinEntries.find(e => e.id === activeId) ?? null;
  const videoId         = activeEntry ? getVideoId(activeEntry.videoUrl) : null;
  const animEntry       = pinEntries.find(e => e.id === animTrigger?.id) ?? null;
  const grenadeIcon    = animEntry?.type === 'flash'   ? '/images/flashbang.webp'
                       : animEntry?.type === 'molotov' ? '/images/molotov.webp'
                       : '/images/smoke-grenade-icon.webp';
  const flashBloomStyle = (iconState && animEntry?.type === 'flash' && iconState.landElapsed >= 0)
    ? getFlashStyle(iconState.landElapsed)
    : null;

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

    const isFlash       = entry.type === 'flash';
    const isInstantLand = entry.type === 'flash' || entry.type === 'molotov';
    const effectiveCycle = isFlash ? (TRAVEL + FLASH_TOTAL) : CYCLE;

    function animate(timestamp: number) {
      if (cycleStart === null) cycleStart = timestamp;
      const elapsed = timestamp - cycleStart;

      if (elapsed >= effectiveCycle) {
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
        if (isInstantLand) {
          setIconState({ x: t.x, y: t.y, rotation: 720, bobbleY: 0, landElapsed });
        } else {
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
      }
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [animTrigger, entries]);

  // Auto-trigger from list view "View on Map" button or admin row click
  useEffect(() => {
    if (!autoTriggerEntryId) return;
    setActiveId(autoTriggerEntryId);
    activeIdRef.current = autoTriggerEntryId;
    onActiveChangeRef.current?.(autoTriggerEntryId);
    setAnimTrigger(prev => ({ id: autoTriggerEntryId, nonce: prev?.id === autoTriggerEntryId ? (prev.nonce + 1) : 0 }));
    onAutoTriggered?.();
  }, [autoTriggerEntryId]);

  function triggerAnim(id: string) {
    setAnimTrigger(prev => ({ id, nonce: prev?.id === id ? (prev.nonce + 1) : 0 }));
  }

  function handleReset() {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    setActiveId(null);
    activeIdRef.current = null;
    setHoveredId(null);
    hoveredIdRef.current = null;
    setAnimTrigger(null);
    setIconState(null);
    onActiveChange?.(null);
  }

  function toggleFilter(type: string) {
    const isRemoving = activeFilters.has(type) && activeFilters.size > 1;
    if (isRemoving && (activeEntry?.type === type || animEntry?.type === type)) handleReset();
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) { if (next.size > 1) next.delete(type); }
      else next.add(type);
      return next;
    });
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
    const next = activeId === id ? null : id;
    setActiveId(next);
    activeIdRef.current = next;
    onActiveChange?.(next);
    if (next) triggerAnim(id);
  }

  return (
    <div className="flex gap-3 items-start h-full">

      {/* ── Filter panel ── */}
      <div className="flex-shrink-0 flex flex-col justify-center h-full">
        <div className="rounded-sm border border-border-dim overflow-hidden bg-bg-primary/85">
          <div className="px-3 py-2 border-b border-border-dim bg-bg-surface">
            <p className="font-heading text-[10px] uppercase tracking-wider text-zinc-400">Utility</p>
          </div>
          <div className="px-3 py-2.5 border-b border-border-dim">
            <p className="text-[10px] text-zinc-500 font-body leading-relaxed">
              Click a pin to watch<br />the lineup video
            </p>
          </div>
          <div className="p-2 flex flex-col gap-1.5">
            {availableTypes.map(type => {
              const { color } = PIN_COLORS[type] ?? PIN_COLORS.smoke;
              const isActive = activeFilters.has(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleFilter(type)}
                  className="px-4 py-3 rounded-sm font-heading text-xs uppercase tracking-wider transition-all w-full text-center"
                  style={{
                    border: `1px solid ${color}${isActive ? '80' : '30'}`,
                    background: isActive ? `${color}22` : `${color}08`,
                    color: isActive ? color : `${color}50`,
                  }}
                >
                  {TYPE_LABELS[type] ?? type}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Map column — height-driven so no scrolling ── */}
      <div className="relative rounded-sm overflow-hidden select-none flex-shrink-0"
        style={{ height: '100%', cursor: pickMode ? 'crosshair' : 'default' }}
        onClick={(e) => {
          if (pickMode && onCoordPicked) {
            const img = (e.currentTarget as HTMLElement).querySelector('img')!;
            const rect = img.getBoundingClientRect();
            const x = Math.round(((e.clientX - rect.left) / rect.width)  * 1000) / 10;
            const y = Math.round(((e.clientY - rect.top)  / rect.height) * 1000) / 10;
            onCoordPicked({ x, y });
            return;
          }
          const el = e.target as HTMLElement;
          if (!el.closest('[data-pin]')) handleReset();
        }}
      >
        <img src={overviewImage} alt="Map overview" className="h-full w-auto block" draggable={false} />


        {/* Arc SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {filteredPinEntries.map(entry => {
            const show = hoveredId === entry.id || activeId === entry.id || animTrigger?.id === entry.id;
            if (!show) return null;
            const { f, t, cx, cy } = computeArc(entry);
            return <path key={entry.id} d={`M ${f.x} ${f.y} Q ${cx} ${cy} ${t.x} ${t.y}`}
              fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.35" />;
          })}
        </svg>

        {/* Smoke bloom */}
        {iconState && animEntry?.type !== 'flash' && animEntry?.type !== 'molotov' && iconState.landElapsed >= 0 && BLOOM_RINGS.map((r, i) => {
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

        {/* Flash bloom */}
        {flashBloomStyle && iconState && (
          <div className="absolute pointer-events-none rounded-full" style={{
            left: `${iconState.x}%`, top: `${iconState.y}%`,
            width: '96px', height: '96px',
            transform: `translate(-50%, -50%) scale(${flashBloomStyle.scale})`,
            opacity: flashBloomStyle.opacity,
            background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(220,240,255,1) 20%, rgba(180,220,255,0.7) 50%, transparent 78%)',
            zIndex: 20,
          }} />
        )}

        {/* Fire bloom */}
        {iconState && animEntry?.type === 'molotov' && iconState.landElapsed >= 0 && (() => {
          const flicker = Math.sin(iconState.landElapsed * 0.025) * 0.07 + Math.sin(iconState.landElapsed * 0.041) * 0.04;
          return FIRE_RINGS.map((r, i) => {
            const fs = getFireStyle(iconState.landElapsed, r.stagger);
            if (!fs) return null;
            const gradient = r.core
              ? 'radial-gradient(circle, rgba(255,235,80,0.97) 0%, rgba(255,130,0,0.90) 28%, rgba(200,40,0,0.70) 54%, rgba(80,5,0,0.25) 76%, transparent 92%)'
              : 'radial-gradient(circle, rgba(255,100,0,0.90) 0%, rgba(185,35,0,0.74) 38%, rgba(110,12,0,0.38) 62%, transparent 86%)';
            return (
              <div key={i} className="absolute pointer-events-none rounded-full" style={{
                left: `${iconState.x}%`, top: `${iconState.y}%`,
                width: `${r.size}px`, height: `${r.size}px`,
                transform: `translate(calc(-50% + ${r.dx}px), calc(-50% + ${r.dy}px)) scale(${fs.scale})`,
                opacity: Math.min(1, Math.max(0, fs.opacity + flicker)),
                background: gradient,
                mixBlendMode: 'screen',
                zIndex: 20,
              }} />
            );
          });
        })()}

        {/* Grenade icon */}
        {iconState && ((animEntry?.type === 'flash' || animEntry?.type === 'molotov') ? iconState.landElapsed < 0 : iconState.landElapsed < BOUNCE_TOTAL) && (
          <img src={grenadeIcon} alt="" className="absolute pointer-events-none"
            style={{
              left: `${iconState.x}%`, top: `${iconState.y}%`,
              transform: `translate(-50%, calc(-50% + ${iconState.bobbleY}px)) rotate(${iconState.rotation}deg)`,
              width: '37px', height: '37px', zIndex: 16,
            }}
          />
        )}

        {/* Inactive pins — faded, click to enable that type */}
        {pinEntries.filter(e => !activeFilters.has(e.type)).map(entry => {
          const { color } = PIN_COLORS[entry.type] ?? PIN_COLORS.smoke;
          return (
            <div
              key={`inactive-${entry.id}`}
              data-pin="true"
              className="absolute cursor-pointer"
              title={`Click to show ${TYPE_LABELS[entry.type] ?? entry.type}`}
              style={{
                left: `${entry.fromCoords!.x}%`, top: `${entry.fromCoords!.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 8, opacity: 0.22, transition: 'opacity 0.15s',
              }}
              onClick={(e) => { e.stopPropagation(); toggleFilter(entry.type); handleClick(entry.id); }}
            >
              <div className="w-4 h-4 rounded-full relative" style={{
                background: `radial-gradient(circle at 33% 28%, rgba(255,255,255,0.9) 0%, ${color} 48%, ${color}bb 100%)`,
                border: `1.5px solid ${color}`,
              }}>
                <div className="absolute rounded-full" style={{ width: '32%', height: '32%', top: '14%', left: '16%', background: 'rgba(255,255,255,0.72)' }} />
              </div>
            </div>
          );
        })}

        {/* Active pins */}
        {filteredPinEntries.map(entry => {
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
              <PinDot x={entry.fromCoords!.x} y={entry.fromCoords!.y} type="from" utilityType={entry.type} {...props} />
              <PinDot x={entry.toCoords!.x}   y={entry.toCoords!.y}   type="to"   utilityType={entry.type} {...props} />
              <div
                className="absolute cursor-pointer"
                style={{
                  left: `${entry.fromCoords!.x}%`,
                  top: `${entry.fromCoords!.y}%`,
                  transform: entry.fromCoords!.y > 90
                    ? 'translate(calc(-100% - 14px), -50%)'
                    : 'translate(-50%, 14px)',
                  zIndex: 11,
                }}
                onMouseEnter={() => handleMouseEnter(entry.id)}
                onMouseLeave={() => handleMouseLeave()}
                onClick={(e) => { e.stopPropagation(); handleClick(entry.id); }}
              >
                <span
                  className="font-heading text-[10px] uppercase tracking-wider whitespace-nowrap px-2 py-1 rounded-sm border"
                  style={{
                    borderColor: `${PIN_COLORS[entry.type]?.color ?? '#f59e0b'}99`,
                    background: `linear-gradient(${PIN_COLORS[entry.type]?.color ?? '#f59e0b'}38, ${PIN_COLORS[entry.type]?.color ?? '#f59e0b'}38), rgba(10,10,14,0.88)`,
                    color: PIN_COLORS[entry.type]?.color ?? '#f59e0b',
                  }}
                >
                  {entry.name}
                </span>
              </div>
            </div>
          );
        })}

        {filteredPinEntries.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-zinc-600 text-sm font-body uppercase tracking-widest">No map pins for this side yet</p>
          </div>
        )}

        {/* Admin ghost pins for coord picker */}
        {pickedFrom && (
          <div className="absolute pointer-events-none z-30" style={{ left: `${pickedFrom.x}%`, top: `${pickedFrom.y}%`, transform: 'translate(-50%,-50%)' }}>
            <div className="w-4 h-4 rounded-full border-2 border-accent bg-accent/30" />
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[9px] font-heading text-accent whitespace-nowrap">FROM</span>
          </div>
        )}
        {pickedTo && (
          <div className="absolute pointer-events-none z-30" style={{ left: `${pickedTo.x}%`, top: `${pickedTo.y}%`, transform: 'translate(-50%,-50%)' }}>
            <div className="w-3 h-3 rounded-full border-2 border-zinc-300 bg-zinc-300/30" />
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[9px] font-heading text-zinc-300 whitespace-nowrap">TO</span>
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
              <button onClick={() => { setActiveId(null); activeIdRef.current = null; onActiveChange?.(null); }}
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

      {/* ── Admin panel (optional, sits to right of video) ── */}
      {adminPanel}

    </div>
  );
}
