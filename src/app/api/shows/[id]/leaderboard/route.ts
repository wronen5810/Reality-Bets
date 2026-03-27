import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceSupabase();

  const [{ data: pts }, { data: users }] = await Promise.all([
    supabase.from('points').select('user_email, points').eq('show_id', id),
    supabase.from('allowed_users').select('email, display_name'),
  ]);

  const userMap = new Map((users ?? []).map((u) => [u.email, u.display_name]));

  // Aggregate by user
  const agg = new Map<string, { total: number; count: number }>();
  for (const p of pts ?? []) {
    const cur = agg.get(p.user_email) ?? { total: 0, count: 0 };
    agg.set(p.user_email, { total: cur.total + p.points, count: cur.count + 1 });
  }

  const leaderboard = Array.from(agg.entries())
    .map(([email, { total, count }]) => ({
      user_email: email,
      display_name: userMap.get(email) ?? email,
      total_points: total,
      episodes_bet: count,
    }))
    .sort((a, b) => b.total_points - a.total_points);

  return NextResponse.json(leaderboard);
}
