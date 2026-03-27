import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/bets/[episodeId] — get current user's bet for an episode
export async function GET(_req: NextRequest, { params }: { params: Promise<{ episodeId: string }> }) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const { episodeId } = await params;
  const supabase = createServiceSupabase();

  const { data } = await supabase
    .from('bets')
    .select('*')
    .eq('episode_id', episodeId)
    .eq('user_email', auth.user.email)
    .single();

  return NextResponse.json(data ?? null);
}
