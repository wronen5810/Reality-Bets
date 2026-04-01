import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const supabase = createServiceSupabase();
  const { data: groups, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get member and show counts for each group
  const enriched = await Promise.all(
    (groups ?? []).map(async (group) => {
      const [{ count: memberCount }, { count: showCount }] = await Promise.all([
        supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', group.id),
        supabase.from('show_groups').select('*', { count: 'exact', head: true }).eq('group_id', group.id),
      ]);
      return { ...group, member_count: memberCount ?? 0, show_count: showCount ?? 0 };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const supabase = createServiceSupabase();
  const { data, error } = await supabase.from('groups').insert({ name }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
