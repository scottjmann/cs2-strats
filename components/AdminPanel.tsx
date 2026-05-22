'use client';

import { useState, useEffect, useRef } from 'react';
import type { UtilityEntry, UtilityType, Side } from '@/lib/types';
import type { Coords } from '@/lib/types';
import { AdminEntryForm } from './AdminEntryForm';
import type { PickMode } from './AdminEntryForm';

const TYPE_COLORS: Record<UtilityType, string> = {
  smoke:   'text-amber-400',
  flash:   'text-sky-300',
  molotov: 'text-orange-400',
  he:      'text-green-400',
};

const TYPE_LABELS: Record<UtilityType, string> = {
  smoke: 'Smokes', flash: 'Flashes', molotov: 'Molotovs', he: 'HE Grenades',
};

const TYPE_ORDER: UtilityType[] = ['smoke', 'flash', 'molotov', 'he'];

interface Props {
  entries: UtilityEntry[];
  mapId: string;
  side: Side;
  pickMode: PickMode;
  pickedFrom: Coords | null;
  pickedTo: Coords | null;
  onSetPickMode: (mode: PickMode) => void;
  onInitCoords: (from: Coords | null, to: Coords | null) => void;
  onSaved: () => void;
  onTriggerMap: (entryId: string) => void;
  activeEntryId?: string | null;
}

export function AdminPanel({
  entries, mapId, side, pickMode, pickedFrom, pickedTo,
  onSetPickMode, onInitCoords, onSaved, onTriggerMap, activeEntryId,
}: Props) {
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingEntry, setEditingEntry] = useState<UtilityEntry | null>(null);

  // Scroll active entry into view when selection changes
  const activeRowRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (mode === 'list' && activeRowRef.current) {
      activeRowRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeEntryId, mode]);

  function handleAdd() {
    onInitCoords(null, null);
    setMode('add');
  }

  function handleEdit(entry: UtilityEntry) {
    onInitCoords(entry.fromCoords ?? null, entry.toCoords ?? null);
    onTriggerMap(entry.id);
    setEditingEntry(entry);
    setMode('edit');
  }

  function handleCancel() {
    onInitCoords(null, null);
    setMode('list');
    setEditingEntry(null);
  }

  function handleSaved() {
    handleCancel();
    onSaved();
  }

  if (mode === 'add' || mode === 'edit') {
    return (
      <AdminEntryForm
        mapId={mapId}
        side={side}
        pickMode={pickMode}
        pickedFrom={pickedFrom}
        pickedTo={pickedTo}
        onSetPickMode={onSetPickMode}
        onSaved={handleSaved}
        onCancel={handleCancel}
        initialEntry={mode === 'edit' ? editingEntry ?? undefined : undefined}
      />
    );
  }

  // ── List mode ─────────────────────────────────────────────────────────────
  const grouped = TYPE_ORDER.reduce((acc, t) => {
    acc[t] = entries.filter(e => e.type === t);
    return acc;
  }, {} as Record<UtilityType, UtilityEntry[]>);

  return (
    <div className="w-80 flex-shrink-0 flex flex-col h-full rounded-sm border border-border-dim overflow-hidden bg-bg-primary/85">

      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border-dim bg-bg-surface flex items-center justify-between flex-shrink-0">
        <span className="font-heading font-bold text-xs uppercase tracking-wider text-accent">Admin</span>
        <button
          onClick={handleAdd}
          className="px-2.5 py-1 text-[10px] font-heading font-bold uppercase tracking-wider rounded-sm border border-accent/40 text-accent hover:border-accent hover:bg-accent/10 transition-colors"
        >
          + Add New
        </button>
      </div>

      {/* Entry list */}
      <div className="flex-1 overflow-y-auto">
        {TYPE_ORDER.map(type => {
          const group = grouped[type];
          if (!group.length) return null;
          return (
            <div key={type}>
              <div className="px-3 py-1.5 bg-bg-surface/50 border-b border-border-dim sticky top-0 z-10">
                <span className={`text-[10px] font-heading uppercase tracking-wider ${TYPE_COLORS[type]}`}>
                  {TYPE_LABELS[type]}
                </span>
              </div>
              {group.map(entry => {
                const isActive = entry.id === activeEntryId;
                return (
                  <div
                    key={entry.id}
                    ref={isActive ? activeRowRef : null}
                    className={[
                      'flex items-center justify-between px-3 py-2 border-b border-border-dim transition-colors cursor-pointer',
                      isActive
                        ? 'bg-accent/10 border-l-2 border-l-accent'
                        : 'border-l-2 border-l-transparent hover:bg-bg-elevated',
                    ].join(' ')}
                    onClick={() => onTriggerMap(entry.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-body truncate ${isActive ? 'text-accent' : 'text-zinc-200'}`}>
                        {entry.name}
                      </p>
                      <p className="text-[10px] text-zinc-600 font-body truncate">
                        {entry.from} → {entry.to}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(entry); }}
                      className="ml-2 flex-shrink-0 px-2 py-0.5 text-[10px] font-heading uppercase tracking-wider text-zinc-500 hover:text-accent border border-transparent hover:border-accent/30 rounded-sm transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}

        {entries.length === 0 && (
          <p className="px-3 py-8 text-center text-xs text-zinc-600 font-body">
            No entries yet. Click + Add New to get started.
          </p>
        )}
      </div>
    </div>
  );
}
