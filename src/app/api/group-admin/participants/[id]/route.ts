import { NextRequest, NextResponse } from 'next/server';
import { requireGroupAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

async function verifyParticipantOwnership(
  supabase: ReturnType<typeof import('@/lib/supabase-server').createServiceSupabase>,
  participantId: string,
  groupIds: string[]
): Promise<boolean> {
  const { data: participant } = await supabase
    .from('participants')
    .select('show_id')
    .eq('id', participantId)
    .single();
  if (!participant) return false;

  const { data: showGroup } = await supabase
    .from('show_groups')
    .select('group_id')
    .eq('show_id', participant.show_id)
    .in('group_id', groupIds)
    .single();
  return !!showGroup;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireGroupAdmin();
  if ('error' in auth) return auth.error;

  const { groupIds } = auth;
  const { id } = await params;
  const supabase = createServiceSupabase();

  const allowed = await verifyParticipantOwnership(supabase, id, groupIds);
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { name, photo_url, is_active } = await request.json();
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (photo_url !== undefined) updates.photo_url = photo_url;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data, error } = await supabase
    .from('participants')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireGroupAdmin();
  if ('error' in auth) return auth.error;

  const { groupIds } = auth;
  const { id } = await params;
  const supabase = createServiceSupabase();

  const allowed = await verifyParticipantOwnership(supabase, id, groupIds);
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await supabase.from('participants').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
