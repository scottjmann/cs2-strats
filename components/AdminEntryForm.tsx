'use client';

import { useState } from 'react';
import type { UtilityType, Side, UtilityEntry } from '@/lib/types';

export type PickMode = 'from' | 'to' | null;

interface Props {
  mapId: string;
  side: Side;
  pickMode: PickMode;
  pickedFrom: { x: number; y: number } | null;
  pickedTo:   { x: number; y: number } | null;
  onSetPickMode: (mode: PickMode) => void;
  onSaved: () => void;
  onCancel: () => void;
  initialEntry?: UtilityEntry;
}

const TYPES: UtilityType[] = ['smoke', 'flash', 'molotov', 'he'];
const TYPE_LABELS: Record<UtilityType, string> = { smoke: 'Smoke', flash: 'Flash', molotov: 'Molotov', he: 'HE Grenade' };

function CoordField({ label, coords, pickMode, thisMode, onPick }: {
  label: string;
  coords: { x: number; y: number } | null;
  pickMode: PickMode;
  thisMode: 'from' | 'to';
  onPick: () => void;
}) {
  const isActive = pickMode === thisMode;
  return (
    <div>
      <p className="text-[10px] font-heading uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
      <button
        type="button"
        onClick={onPick}
        className={[
          'w-full flex items-center justify-between px-3 py-2 rounded-sm border text-xs font-body transition-all',
          isActive
            ? 'border-accent bg-accent/10 text-accent'
            : coords
            ? 'border-border-dim bg-bg-elevated text-zinc-300'
            : 'border-border-dim bg-bg-elevated text-zinc-600',
        ].join(' ')}
      >
        <span>{isActive ? 'Click map to place…' : coords ? `x ${coords.x.toFixed(1)}, y ${coords.y.toFixed(1)}` : 'Not set'}</span>
        <span className="text-[10px] font-heading uppercase tracking-wider text-zinc-500">
          {isActive ? 'Cancel' : 'Pick'}
        </span>
      </button>
    </div>
  );
}

export function AdminEntryForm({
  mapId, side, pickMode, pickedFrom, pickedTo,
  onSetPickMode, onSaved, onCancel, initialEntry,
}: Props) {
  const isEditing = !!initialEntry;
  const [type, setType]           = useState<UtilityType>(initialEntry?.type ?? 'smoke');
  const [name, setName]           = useState(initialEntry?.name ?? '');
  const [url, setUrl]             = useState(initialEntry?.videoUrl ?? '');
  const [fromLabel, setFromLabel] = useState(initialEntry?.from ?? '');
  const [toLabel, setToLabel]     = useState(initialEntry?.to ?? '');
  const [description, setDesc]    = useState(initialEntry?.description ?? '');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) { setError('Name is required'); return; }
    setSaving(true);
    setError('');

    const id = isEditing
      ? initialEntry.id
      : `${type}-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;

    const res = await fetch('/api/utility', {
      method: isEditing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': localStorage.getItem('cs2-admin-token') ?? '',
      },
      body: JSON.stringify({
        mapId,
        entry: {
          id, name, type, side,
          description,
          fromLabel: fromLabel || 'Unknown',
          toLabel:   toLabel   || 'Unknown',
          videoUrl:  url,
          fromX: pickedFrom?.x, fromY: pickedFrom?.y,
          toX:   pickedTo?.x,   toY:   pickedTo?.y,
        },
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? 'Failed to save');
      return;
    }
    onSaved();
  }

  return (
    <div className="w-80 flex-shrink-0 flex flex-col h-full rounded-sm border border-border-dim overflow-hidden bg-bg-primary/85">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border-dim bg-bg-surface flex items-center justify-between">
        <span className="font-heading font-bold text-xs uppercase tracking-wider text-accent">
          {isEditing ? 'Edit Utility' : 'Add Utility'}
        </span>
        <button onClick={onCancel} className="text-zinc-600 hover:text-zinc-300 transition-colors text-xs">✕</button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">

        {/* Type */}
        <div>
          <p className="text-[10px] font-heading uppercase tracking-wider text-zinc-500 mb-1">Nade Type</p>
          <div className="grid grid-cols-2 gap-1">
            {TYPES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={[
                  'py-1.5 rounded-sm border font-heading text-[10px] uppercase tracking-wider transition-all',
                  type === t
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border-dim text-zinc-500 hover:border-border-base',
                ].join(' ')}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <p className="text-[10px] font-heading uppercase tracking-wider text-zinc-500 mb-1">Name</p>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. B Door Smoke"
            className="w-full px-3 py-2 bg-bg-elevated border border-border-dim rounded-sm text-xs text-white font-body placeholder:text-zinc-600 focus:outline-none focus:border-accent/60"
          />
        </div>

        {/* From / To labels */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] font-heading uppercase tracking-wider text-zinc-500 mb-1">From</p>
            <input
              value={fromLabel} onChange={e => setFromLabel(e.target.value)}
              placeholder="T Spawn"
              className="w-full px-2 py-2 bg-bg-elevated border border-border-dim rounded-sm text-xs text-white font-body placeholder:text-zinc-600 focus:outline-none focus:border-accent/60"
            />
          </div>
          <div>
            <p className="text-[10px] font-heading uppercase tracking-wider text-zinc-500 mb-1">To</p>
            <input
              value={toLabel} onChange={e => setToLabel(e.target.value)}
              placeholder="B Doors"
              className="w-full px-2 py-2 bg-bg-elevated border border-border-dim rounded-sm text-xs text-white font-body placeholder:text-zinc-600 focus:outline-none focus:border-accent/60"
            />
          </div>
        </div>

        {/* URL */}
        <div>
          <p className="text-[10px] font-heading uppercase tracking-wider text-zinc-500 mb-1">Video URL</p>
          <input
            value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://youtube.com/shorts/…"
            className="w-full px-3 py-2 bg-bg-elevated border border-border-dim rounded-sm text-xs text-white font-body placeholder:text-zinc-600 focus:outline-none focus:border-accent/60"
          />
        </div>

        {/* Coord picker */}
        <div className="flex flex-col gap-2">
          <CoordField
            label="From Coords"
            coords={pickedFrom}
            pickMode={pickMode}
            thisMode="from"
            onPick={() => onSetPickMode(pickMode === 'from' ? null : 'from')}
          />
          <CoordField
            label="To Coords"
            coords={pickedTo}
            pickMode={pickMode}
            thisMode="to"
            onPick={() => onSetPickMode(pickMode === 'to' ? null : 'to')}
          />
        </div>

        {/* Description */}
        <div>
          <p className="text-[10px] font-heading uppercase tracking-wider text-zinc-500 mb-1">Description <span className="normal-case text-zinc-600">(optional)</span></p>
          <textarea
            value={description} onChange={e => setDesc(e.target.value)}
            rows={2}
            placeholder="Brief description…"
            className="w-full px-3 py-2 bg-bg-elevated border border-border-dim rounded-sm text-xs text-white font-body placeholder:text-zinc-600 focus:outline-none focus:border-accent/60 resize-none"
          />
        </div>

        {error && <p className="text-xs text-red-400 font-body">{error}</p>}

        <button
          type="submit"
          disabled={saving || !name}
          className="w-full py-2 bg-accent text-white font-heading text-xs uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40 mt-auto"
        >
          {saving ? 'Saving…' : 'Save Entry'}
        </button>
      </form>
    </div>
  );
}
