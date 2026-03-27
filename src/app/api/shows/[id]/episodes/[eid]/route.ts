import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; eid: string }> }) {
  const { eid } = await params;
  const supabase = createServiceSupabase();
  const { data, error } = await supabase.from('episodes').select('*').eq('id', eid).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; eid: string }> }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { eid } = await params;
  const body = await request.json();
  const supabase = createServiceSupabase();
  const { data, error } = await supabase.from('episodes').update(body).eq('id', eid).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; eid: string }> }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { eid } = await params;
  const supabase = createServiceSupabase();
  const { error } = await supabase.from('episodes').delete().eq('id', eid);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
