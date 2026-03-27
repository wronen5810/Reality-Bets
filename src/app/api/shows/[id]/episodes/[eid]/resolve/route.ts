import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// POST /api/shows/[id]/episodes/[eid]/resolve
// Sets results and calculates points for all bets
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; eid: string }> }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { eid, id: showId } = await params;
  const { eliminated_participant_id, winner_participant_id } = await request.json();

  if (!eliminated_participant_id || !winner_participant_id) {
    return NextResponse.json({ error: 'Both eliminated and winner participants are required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  // Update episode with results
  const { error: epError } = await supabase
    .from('episodes')
    .update({ status: 'resolved', eliminated_participant_id, winner_participant_id })
    .eq('id', eid);

  if (epError) return NextResponse.json({ error: epError.message }, { status: 500 });

  // Fetch all bets for this episode
  const { data: bets } = await supabase.from('bets').select('*').eq('episode_id', eid);
  if (!bets || bets.length === 0) return NextResponse.json({ success: true, points_awarded: 0 });

  // Calculate and upsert points
  const pointsRows = bets.map((bet) => {
    let pts = 0;
    if (bet.eliminated_participant_id === eliminated_participant_id) pts++;
    if (bet.winner_participant_id === winner_participant_id) pts++;
    return { user_email: bet.user_email, episode_id: eid, show_id: showId, points: pts };
  });

  const { error: ptError } = await supabase
    .from('points')
    .upsert(pointsRows, { onConflict: 'user_email,episode_id' });

  if (ptError) return NextResponse.json({ error: ptError.message }, { status: 500 });

  return NextResponse.json({ success: true, points_awarded: pointsRows.length });
}
