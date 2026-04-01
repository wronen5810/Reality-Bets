import { NextResponse } from 'next/server';
import { requireGroupAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

export async function GET() {
  const auth = await requireGroupAdmin();
  if ('error' in auth) return auth.error;

  const { groupIds } = auth;
  const supabase = createServiceSupabase();

  const groups = await Promise.all(
    groupIds.map(async (groupId) => {
      const [{ data: group }, { data: members }, { data: showLinks }] = await Promise.all([
        supabase.from('groups').select('*').eq('id', groupId).single(),
        supabase.from('group_members').select('*').eq('group_id', groupId),
        supabase.from('show_groups').select('show_id, shows(*)').eq('group_id', groupId),
      ]);

      // Enrich members with display_name
      const enrichedMembers = await Promise.all(
        (members ?? []).map(async (m) => {
          const { data: user } = await supabase
            .from('allowed_users')
            .select('display_name')
            .eq('email', m.user_email)
            .single();
          return { ...m, display_name: user?.display_name ?? null };
        })
      );

      const shows = (showLinks ?? []).map((row: { shows: unknown }) => row.shows);

      return { ...group, members: enrichedMembers, shows };
    })
  );

  return NextResponse.json(groups);
}
