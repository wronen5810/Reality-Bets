import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getUserGroupIds } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  const supabase = createServiceSupabase();

  // Check session
  const cookieStore = await cookies();
  const anonClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c: { name: string; value: string; options?: object }[]) =>
          c.forEach(({ name, value, options }) => cookieStore.set(name, value, options as never)),
      },
    }
  );
  const { data: { user } } = await anonClient.auth.getUser();

  // Site admin sees all shows
  if (user?.email === process.env.ADMIN_EMAIL) {
    const { data, error } = await supabase.from('shows').select('*').order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Regular user: filter by groups
  if (user?.email) {
    const groupIds = await getUserGroupIds(user.email);
    if (!groupIds.length) return NextResponse.json([]);

    const { data: showLinks } = await supabase
      .from('show_groups')
      .select('show_id')
      .in('group_id', groupIds);
    const showIds = (showLinks ?? []).map((r: { show_id: string }) => r.show_id);
    if (!showIds.length) return NextResponse.json([]);

    const { data, error } = await supabase
      .from('shows')
      .select('*')
      .in('id', showIds)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json([]);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { name, description } = await request.json();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const supabase = createServiceSupabase();
  const { data, error } = await supabase.from('shows').insert({ name, description }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
