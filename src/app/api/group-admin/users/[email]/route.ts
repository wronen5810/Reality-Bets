import { NextRequest, NextResponse } from 'next/server';
import { requireGroupAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const auth = await requireGroupAdmin();
  if ('error' in auth) return auth.error;

  const { groupIds } = auth;
  const { email } = await params;
  const decodedEmail = decodeURIComponent(email);
  const { role, group_id } = await request.json();

  if (!group_id) return NextResponse.json({ error: 'group_id is required' }, { status: 400 });
  if (!groupIds.includes(group_id)) {
    return NextResponse.json({ error: 'Forbidden: not your group' }, { status: 403 });
  }

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('group_members')
    .update({ role })
    .eq('group_id', group_id)
    .eq('user_email', decodedEmail)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const auth = await requireGroupAdmin();
  if ('error' in auth) return auth.error;

  const { groupIds } = auth;
  const { email } = await params;
  const decodedEmail = decodeURIComponent(email);
  const { searchParams } = new URL(request.url);
  const group_id = searchParams.get('group_id');

  if (!group_id) return NextResponse.json({ error: 'group_id query param is required' }, { status: 400 });
  if (!groupIds.includes(group_id)) {
    return NextResponse.json({ error: 'Forbidden: not your group' }, { status: 403 });
  }

  const supabase = createServiceSupabase();
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', group_id)
    .eq('user_email', decodedEmail);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
