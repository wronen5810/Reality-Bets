import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const supabase = createServiceSupabase();
  const { data: members, error } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', id)
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Join with allowed_users to get display_name
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const { user_email, role } = await request.json();
  if (!user_email) return NextResponse.json({ error: 'user_email is required' }, { status: 400 });

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('group_members')
    .insert({ group_id: id, user_email, role: role ?? 'member' })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
