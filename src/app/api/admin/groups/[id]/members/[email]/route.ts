import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; email: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { id, email } = await params;
  const decodedEmail = decodeURIComponent(email);
  const { role } = await request.json();
  if (!role) return NextResponse.json({ error: 'role is required' }, { status: 400 });

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('group_members')
    .update({ role })
    .eq('group_id', id)
    .eq('user_email', decodedEmail)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; email: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { id, email } = await params;
  const decodedEmail = decodeURIComponent(email);
  const supabase = createServiceSupabase();
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', id)
    .eq('user_email', decodedEmail);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
