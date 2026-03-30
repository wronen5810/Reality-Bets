export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { createServiceSupabase } from '@/lib/supabase-server';
import { requireUser } from '@/lib/auth';
import type { Show, Episode, Participant, LeaderboardEntry, Bet } from '@/lib/types';
import { format } from 'date-fns';

export default async function ShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireUser();
  if ('error' in auth) return notFound();

  const supabase = createServiceSupabase();

  const [
    { data: show },
    { data: episodes },
    { data: participants },
    { data: pts },
    { data: users },
    { data: myBets },
  ] = await Promise.all([
    supabase.from('shows').select('*').eq('id', id).single(),
    supabase.from('episodes').select('*').eq('show_id', id).order('episode_number'),
    supabase.from('participants').select('*').eq('show_id', id),
    supabase.from('points').select('user_email, episode_id, points').eq('show_id', id),
    supabase.from('allowed_users').select('email, display_name, is_active'),
    supabase.from('bets').select('*').eq('user_email', auth.user.email),
  ]);

  if (!show) return notFound();

  // Build leaderboard — include ALL active users, even those with 0 points
  const agg = new Map<string, { total: number; count: number }>();
  for (const p of pts ?? []) {
    const cur = agg.get(p.user_email) ?? { total: 0, count: 0 };
    agg.set(p.user_email, { total: cur.total + p.points, count: cur.count + 1 });
  }
  const leaderboard: LeaderboardEntry[] = (users ?? [])
    .filter((u: { email: string; display_name: string; is_active: boolean }) => u.is_active)
    .map((u: { email: string; display_name: string }) => {
      const { total = 0, count = 0 } = agg.get(u.email) ?? {};
      return { user_email: u.email, display_name: u.display_name, total_points: total, episodes_bet: count };
    })
    .sort((a, b) => b.total_points - a.total_points);

  const participantMap = new Map((participants as Participant[])?.map((p) => [p.id, p.name]));
  const myBetMap = new Map((myBets as Bet[])?.map((b) => [b.episode_id, b]));
  const myPointsMap = new Map(
    (pts ?? []).filter((p: { user_email: string }) => p.user_email === auth.user.email)
      .map((p: { episode_id: string; points: number }) => [p.episode_id, p.points])
  );
  const now = new Date();

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">{(show as Show).name}</h1>
        {(show as Show).description && (
          <p className="text-gray-500 mb-6">{(show as Show).description}</p>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Episodes */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Episodes</h2>
            <div className="space-y-3">
              {(episodes as Episode[])?.map((ep) => {
                const isLocked = new Date(ep.air_datetime) <= now;
                const myBet = myBetMap.get(ep.id);
                return (
                  <div key={ep.id} className="bg-white rounded-xl shadow p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          Ep {ep.episode_number}{ep.title ? `: ${ep.title}` : ''}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(new Date(ep.air_datetime), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {ep.status === 'resolved' && (
                          <span className="text-lg leading-none">
                            {(myPointsMap.get(ep.id) ?? 0) > 0 ? '😊' : '😞'}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ep.status === 'resolved' ? 'bg-green-100 text-green-700' : isLocked ? 'bg-gray-100 text-gray-500' : 'bg-indigo-100 text-indigo-700'}`}>
                          {ep.status === 'resolved' ? 'Resolved' : isLocked ? 'Locked' : 'Open'}
                        </span>
                      </div>
                    </div>

                    {ep.status === 'resolved' && (
                      <div className="mt-2 text-sm text-gray-600 space-y-0.5">
                        <p>Eliminated: <strong>{participantMap.get(ep.eliminated_participant_id!) ?? '—'}</strong></p>
                        <p>Winner: <strong>{participantMap.get(ep.winner_participant_id!) ?? '—'}</strong></p>
                      </div>
                    )}

                    {myBet && (
                      <div className="mt-2 text-sm border-t pt-2 text-gray-600 space-y-0.5">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Your bet</p>
                        {ep.status === 'resolved' || isLocked ? (
                          <>
                            <p>Eliminated: {participantMap.get(myBet.eliminated_participant_id) ?? '—'}</p>
                            <p>Winner: {participantMap.get(myBet.winner_participant_id) ?? '—'}</p>
                          </>
                        ) : (
                          <p className="italic text-gray-400">Bet placed (hidden until locked)</p>
                        )}
                      </div>
                    )}

                    {!isLocked && (
                      <Link
                        href={`/shows/${id}/episodes/${ep.id}`}
                        className="mt-3 inline-block text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700"
                      >
                        {myBet ? 'Change bet' : 'Place bet'}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Leaderboard */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Leaderboard</h2>
            {!leaderboard.length ? (
              <p className="text-gray-400 text-sm">No scores yet.</p>
            ) : (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-500 font-medium">#</th>
                      <th className="px-4 py-2 text-left text-gray-500 font-medium">Player</th>
                      <th className="px-4 py-2 text-right text-gray-500 font-medium">Pts</th>
                      <th className="px-4 py-2 text-right text-gray-500 font-medium">Eps</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {leaderboard.map((entry, i) => (
                      <tr key={entry.user_email} className={entry.user_email === auth.user.email ? 'bg-indigo-50' : ''}>
                        <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                        <td className="px-4 py-2 font-medium">{entry.display_name}</td>
                        <td className="px-4 py-2 text-right font-semibold">{entry.total_points}</td>
                        <td className="px-4 py-2 text-right text-gray-400">{entry.episodes_bet}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
