import { createClient } from '@supabase/supabase-js';
import type { UtilityEntry, UtilityType, Side } from './types';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

// ── Row shape from DB ─────────────────────────────────────────────────────────
interface UtilityRow {
  id: string;
  map_id: string;
  name: string;
  type: string;
  side: string;
  description: string;
  from_label: string;
  to_label: string;
  video_url: string;
  from_x: number | null;
  from_y: number | null;
  to_x: number | null;
  to_y: number | null;
}

export function rowToEntry(row: UtilityRow): UtilityEntry {
  return {
    id: row.id,
    name: row.name,
    type: row.type as UtilityType,
    side: row.side as Side,
    description: row.description ?? '',
    from: row.from_label,
    to: row.to_label,
    videoUrl: row.video_url ?? '',
    fromCoords: row.from_x != null && row.from_y != null ? { x: row.from_x, y: row.from_y } : undefined,
    toCoords:   row.to_x   != null && row.to_y   != null ? { x: row.to_x,   y: row.to_y   } : undefined,
  };
}

export async function fetchMapEntries(mapId: string): Promise<UtilityEntry[]> {
  const { data, error } = await supabase
    .from('utility_entries')
    .select('*')
    .eq('map_id', mapId);
  if (error || !data) return [];
  return data.map(rowToEntry);
}
