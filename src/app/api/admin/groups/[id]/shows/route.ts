import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('show_groups')
    .select('show_id, shows(*)')
    .eq('group_id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const shows = (data ?? []).map((row: { shows: unknown }) => row.shows);
  return NextResponse.json(shows);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const { show_id } = await request.json();
  if (!show_id) return NextResponse.json({ error: 'show_id is required' }, { status: 400 });

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('show_groups')
    .insert({ show_id, group_id: id })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const { show_id } = await request.json();
  if (!show_id) return NextResponse.json({ error: 'show_id is required' }, { status: 400 });

  const supabase = createServiceSupabase();
  const { error } = await supabase
    .from('show_groups')
    .delete()
    .eq('show_id', show_id)
    .eq('group_id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
