import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const supabase = createServiceSupabase();
  const { data, error } = await supabase.from('groups').update({ name }).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const supabase = createServiceSupabase();
  const { error } = await supabase.from('groups').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
