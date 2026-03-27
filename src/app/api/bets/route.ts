import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// POST /api/bets — place or update a bet
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const { episode_id, eliminated_participant_id, winner_participant_id } = await request.json();

  if (!episode_id || !eliminated_participant_id || !winner_participant_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  // Verify user is in allowed_users and active
  const { data: allowedUser } = await supabase
    .from('allowed_users')
    .select('is_active')
    .eq('email', auth.user.email)
    .single();

  if (!allowedUser?.is_active) {
    return NextResponse.json({ error: 'Your account is not active' }, { status: 403 });
  }

  // Verify episode exists and is not locked
  const { data: episode } = await supabase.from('episodes').select('*').eq('id', episode_id).single();
  if (!episode) return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
  if (episode.status === 'resolved') return NextResponse.json({ error: 'Episode already resolved' }, { status: 409 });
  if (new Date(episode.air_datetime) <= new Date()) {
    return NextResponse.json({ error: 'Betting is closed for this episode' }, { status: 409 });
  }

  // Upsert bet
  const { data, error } = await supabase
    .from('bets')
    .upsert(
      { user_email: auth.user.email, episode_id, eliminated_participant_id, winner_participant_id, updated_at: new Date().toISOString() },
      { onConflict: 'user_email,episode_id' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
