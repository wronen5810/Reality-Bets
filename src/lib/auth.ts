import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

async function getSessionUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c: { name: string; value: string; options?: object }[]) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options as never)),
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireAdmin(): Promise<{ user: { email: string } } | { error: NextResponse }> {
  const user = await getSessionUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user: { email: user.email! } };
}

export async function requireUser(): Promise<{ user: { email: string } } | { error: NextResponse }> {
  const user = await getSessionUser();
  if (!user?.email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user: { email: user.email } };
}

export async function requireGroupAdmin(): Promise<{ user: { email: string }; groupIds: string[] } | { error: NextResponse }> {
  const user = await getSessionUser();
  if (!user?.email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const { createServiceSupabase } = await import('./supabase-server');
  const supabase = createServiceSupabase();
  const { data } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_email', user.email)
    .eq('role', 'admin');
  const groupIds = (data ?? []).map((r: { group_id: string }) => r.group_id);
  if (groupIds.length === 0) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user: { email: user.email }, groupIds };
}

export async function getUserGroupIds(email: string): Promise<string[]> {
  const { createServiceSupabase } = await import('./supabase-server');
  const supabase = createServiceSupabase();
  const { data } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_email', email);
  return (data ?? []).map((r: { group_id: string }) => r.group_id);
}
