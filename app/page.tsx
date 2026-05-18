import { MAPS } from '@/data/maps';
import MapTile from '@/components/MapTile';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg-primary">
      {/* Top bar */}
      <header className="border-b border-border-dim bg-bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1 h-6 bg-accent rounded-full" />
            <span className="font-heading font-bold text-lg uppercase tracking-[0.2em] text-white">
              CS2 Strats
            </span>
          </div>
          <span className="hidden sm:block text-xs text-zinc-500 font-body ml-1 uppercase tracking-widest">
            / Playbook
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Section header */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-heading font-bold text-2xl uppercase tracking-[0.15em] text-white">
              Select Map
            </h2>
            <p className="text-sm text-zinc-500 font-body mt-0.5">
              Choose a map to view utility lineups.
            </p>
          </div>
          <span className="text-xs font-heading uppercase tracking-widest text-zinc-600 border border-border-dim px-2 py-1 rounded-sm">
            Active Duty
          </span>
        </div>

        {/* Map grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {MAPS.map((map) => (
            <MapTile key={map.id} {...map} />
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-zinc-700 font-body mt-10 uppercase tracking-widest">
          More maps coming soon
        </p>
      </div>
    </main>
  );
}
