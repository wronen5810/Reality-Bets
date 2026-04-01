import { NextRequest, NextResponse } from 'next/server';
import { requireGroupAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/group-admin/shows?group_id=...
// Returns linked shows for a group + all shows available to link
export async function GET(request: NextRequest) {
  const auth = await requireGroupAdmin();
  if ('error' in auth) return auth.error;

  const groupId = new URL(request.url).searchParams.get('group_id');
  if (!groupId || !auth.groupIds.includes(groupId)) {
    return NextResponse.json({ error: 'Invalid group' }, { status: 403 });
  }

  const supabase = createServiceSupabase();

  const [{ data: showLinks }, { data: allShows }] = await Promise.all([
    supabase.from('show_groups').select('show_id, shows(*)').eq('group_id', groupId),
    supabase.from('shows').select('*').eq('is_active', true).order('name'),
  ]);

  const linkedShowIds = new Set((showLinks ?? []).map((r: { show_id: string }) => r.show_id));
  const linkedShows = (showLinks ?? []).map((r: { shows: unknown }) => r.shows);
  const availableShows = (allShows ?? []).filter((s) => !linkedShowIds.has(s.id));

  return NextResponse.json({ linkedShows, availableShows });
}

// POST /api/group-admin/shows — link a show to a group
export async function POST(request: NextRequest) {
  const auth = await requireGroupAdmin();
  if ('error' in auth) return auth.error;

  const { group_id, show_id } = await request.json();
  if (!group_id || !show_id) return NextResponse.json({ error: 'group_id and show_id required' }, { status: 400 });
  if (!auth.groupIds.includes(group_id)) return NextResponse.json({ error: 'Invalid group' }, { status: 403 });

  const supabase = createServiceSupabase();
  const { error } = await supabase.from('show_groups').insert({ group_id, show_id });
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Show already linked' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true }, { status: 201 });
}

// DELETE /api/group-admin/shows — unlink a show from a group
export async function DELETE(request: NextRequest) {
  const auth = await requireGroupAdmin();
  if ('error' in auth) return auth.error;

  const { group_id, show_id } = await request.json();
  if (!group_id || !show_id) return NextResponse.json({ error: 'group_id and show_id required' }, { status: 400 });
  if (!auth.groupIds.includes(group_id)) return NextResponse.json({ error: 'Invalid group' }, { status: 403 });

  const supabase = createServiceSupabase();
  const { error } = await supabase.from('show_groups').delete().eq('group_id', group_id).eq('show_id', show_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
