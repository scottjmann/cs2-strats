import Link from 'next/link';
import type { MapMeta } from '@/lib/types';

export default function MapTile({ id, name, thumbnail, accentColor, available }: MapMeta) {
  const inner = (
    <div
      className={[
        'group relative overflow-hidden rounded-sm cursor-pointer',
        'border-2 transition-all duration-200',
        available
          ? 'border-border-dim hover:border-border-bright hover:shadow-tile-hover'
          : 'border-border-dim opacity-50 cursor-not-allowed',
      ].join(' ')}
      style={{ aspectRatio: '16/9' }}
    >
      {/* Map image / colour fallback */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.04]"
        style={{
          backgroundImage: `url(${thumbnail})`,
          backgroundColor: accentColor,
        }}
      />

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

      {/* Hover accent glow inside frame */}
      {available && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ring-inset ring-1 ring-accent/40" />
      )}

      {/* Map name */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5">
        <p className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-white drop-shadow-md leading-none">
          {name}
        </p>
        {!available && (
          <p className="font-body text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">
            Coming soon
          </p>
        )}
      </div>

      {/* Corner accent marks */}
      <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t-2 border-l-2 border-accent/60 group-hover:border-accent transition-colors duration-200" />
      <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t-2 border-r-2 border-accent/60 group-hover:border-accent transition-colors duration-200" />
      <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b-2 border-l-2 border-accent/60 group-hover:border-accent transition-colors duration-200" />
      <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b-2 border-r-2 border-accent/60 group-hover:border-accent transition-colors duration-200" />
    </div>
  );

  if (!available) return inner;

  return <Link href={`/maps/${id}`}>{inner}</Link>;
}
