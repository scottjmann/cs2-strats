import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type EntryBody = {
  id: string; name: string; type: string; side: string;
  description: string; fromLabel: string; toLabel: string;
  videoUrl: string;
  fromX?: number; fromY?: number;
  toX?: number;   toY?: number;
};

function entryToRow(mapId: string, entry: EntryBody) {
  return {
    id:          entry.id,
    map_id:      mapId,
    name:        entry.name,
    type:        entry.type,
    side:        entry.side,
    description: entry.description,
    from_label:  entry.fromLabel,
    to_label:    entry.toLabel,
    video_url:   entry.videoUrl,
    from_x:      entry.fromX ?? null,
    from_y:      entry.fromY ?? null,
    to_x:        entry.toX   ?? null,
    to_y:        entry.toY   ?? null,
  };
}

function isAuthed(req: Request) {
  return req.headers.get('x-admin-token') === 'cs2-admin-session';
}

export async function POST(req: Request) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const { mapId, entry } = await req.json() as { mapId: string; entry: EntryBody };
  const { error } = await adminClient().from('utility_entries').insert(entryToRow(mapId, entry));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const { mapId, entry } = await req.json() as { mapId: string; entry: EntryBody };
  const { error } = await adminClient().from('utility_entries').upsert(entryToRow(mapId, entry));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const { entryId } = await req.json() as { entryId: string };
  const { error } = await adminClient().from('utility_entries').delete().eq('id', entryId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
