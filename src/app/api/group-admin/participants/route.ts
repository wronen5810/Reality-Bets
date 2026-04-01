import { NextRequest, NextResponse } from 'next/server';
import { requireGroupAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

async function getGroupShowIds(supabase: ReturnType<typeof import('@/lib/supabase-server').createServiceSupabase>, groupIds: string[]) {
  const { data } = await supabase
    .from('show_groups')
    .select('show_id')
    .in('group_id', groupIds);
  return (data ?? []).map((r: { show_id: string }) => r.show_id);
}

export async function GET() {
  const auth = await requireGroupAdmin();
  if ('error' in auth) return auth.error;

  const { groupIds } = auth;
  const supabase = createServiceSupabase();
  const showIds = await getGroupShowIds(supabase, groupIds);

  if (!showIds.length) return NextResponse.json([]);

  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .in('show_id', showIds)
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireGroupAdmin();
  if ('error' in auth) return auth.error;

  const { groupIds } = auth;
  const { show_id, name, photo_url } = await request.json();
  if (!show_id || !name) return NextResponse.json({ error: 'show_id and name are required' }, { status: 400 });

  const supabase = createServiceSupabase();
  const showIds = await getGroupShowIds(supabase, groupIds);
  if (!showIds.includes(show_id)) {
    return NextResponse.json({ error: 'Forbidden: show not in your group' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('participants')
    .insert({ show_id, name, photo_url: photo_url ?? null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
