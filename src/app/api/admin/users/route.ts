import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const supabase = createServiceSupabase();
  const { data, error } = await supabase.from('allowed_users').select('*').order('display_name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { email, display_name } = await request.json();
  if (!email || !display_name) return NextResponse.json({ error: 'Email and display name are required' }, { status: 400 });
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('allowed_users')
    .insert({ email: email.toLowerCase().trim(), display_name })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
