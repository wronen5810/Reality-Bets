import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; pid: string }> }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { pid } = await params;
  const body = await request.json();
  const supabase = createServiceSupabase();
  const { data, error } = await supabase.from('participants').update(body).eq('id', pid).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; pid: string }> }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { pid } = await params;
  const supabase = createServiceSupabase();
  const { error } = await supabase.from('participants').delete().eq('id', pid);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
