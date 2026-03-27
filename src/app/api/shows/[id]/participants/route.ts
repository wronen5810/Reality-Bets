import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceSupabase();
  const { data, error } = await supabase.from('participants').select('*').eq('show_id', id).order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { id } = await params;
  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  const supabase = createServiceSupabase();
  const { data, error } = await supabase.from('participants').insert({ show_id: id, name }).select().single();
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Participant already exists' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
