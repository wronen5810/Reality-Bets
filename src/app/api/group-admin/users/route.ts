import { NextRequest, NextResponse } from 'next/server';
import { requireGroupAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

export async function GET() {
  const auth = await requireGroupAdmin();
  if ('error' in auth) return auth.error;

  const { groupIds } = auth;
  const supabase = createServiceSupabase();

  const { data: members, error } = await supabase
    .from('group_members')
    .select('*')
    .in('group_id', groupIds)
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = await Promise.all(
    (members ?? []).map(async (m) => {
      const { data: user } = await supabase
        .from('allowed_users')
        .select('display_name')
        .eq('email', m.user_email)
        .single();
      return { ...m, display_name: user?.display_name ?? null };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const auth = await requireGroupAdmin();
  if ('error' in auth) return auth.error;

  const { groupIds } = auth;
  const { user_email, display_name, role, group_id } = await request.json();

  if (!user_email || !group_id) {
    return NextResponse.json({ error: 'user_email and group_id are required' }, { status: 400 });
  }
  if (!groupIds.includes(group_id)) {
    return NextResponse.json({ error: 'Forbidden: not your group' }, { status: 403 });
  }

  const supabase = createServiceSupabase();

  // Ensure user exists in allowed_users
  const { data: existing } = await supabase
    .from('allowed_users')
    .select('id')
    .eq('email', user_email)
    .single();
  if (!existing) {
    const { error: insertError } = await supabase.from('allowed_users').insert({
      email: user_email,
      display_name: display_name ?? user_email,
      is_active: true,
    });
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('group_members')
    .insert({ group_id, user_email, role: role ?? 'member' })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
