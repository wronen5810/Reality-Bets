import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('show_id', id)
    .order('episode_number');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { id } = await params;
  const { episode_number, title, air_datetime } = await request.json();
  if (!episode_number || !air_datetime) {
    return NextResponse.json({ error: 'episode_number and air_datetime are required' }, { status: 400 });
  }
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('episodes')
    .insert({ show_id: id, episode_number, title, air_datetime })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Episode number already exists' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
