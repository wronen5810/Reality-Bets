'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Episode, Participant } from '@/lib/types';
import { format } from 'date-fns';

export default function ResolveEpisodePage() {
  const { id, eid } = useParams<{ id: string; eid: string }>();
  const router = useRouter();

  const [episode, setEpisode] = useState<Episode | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [eliminated, setEliminated] = useState('');
  const [winner, setWinner] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/shows/${id}/episodes/${eid}`).then((r) => r.json()),
      fetch(`/api/shows/${id}/participants`).then((r) => r.json()),
    ]).then(([ep, parts]) => {
      setEpisode(ep);
      setParticipants(parts);
      if (ep.eliminated_participant_id) setEliminated(ep.eliminated_participant_id);
      if (ep.winner_participant_id) setWinner(ep.winner_participant_id);
    });
  }, [id, eid]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await fetch(`/api/shows/${id}/episodes/${eid}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eliminated_participant_id: eliminated === 'none' ? null : eliminated,
        winner_participant_id: winner === 'none' ? null : winner,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? 'Failed to resolve');
    } else {
      router.push(`/admin/shows/${id}`);
    }
  }

  if (!episode) return <div className="text-gray-400 p-8">Loading…</div>;

  if (episode.status === 'resolved') {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white rounded-xl shadow p-8 text-center">
        <p className="text-green-600 font-semibold mb-4">This episode has already been resolved.</p>
        <Link href={`/admin/shows/${id}`} className="text-indigo-600 hover:underline">← Back to show</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <Link href={`/admin/shows/${id}`} className="text-sm text-indigo-600 hover:underline">← Back to show</Link>
      <h1 className="text-xl font-bold mt-2 mb-1">
        Resolve Episode {episode.episode_number}{episode.title ? `: ${episode.title}` : ''}
      </h1>
      <p className="text-sm text-gray-400 mb-6">
        Aired {format(new Date(episode.air_datetime), 'MMM d, yyyy HH:mm')}
      </p>
      <div className="bg-white rounded-xl shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Who was eliminated?</label>
            <select
              required
              value={eliminated}
              onChange={(e) => setEliminated(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select…</option>
              <option value="none">אף אחד (no one)</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Who won the episode?</label>
            <select
              required
              value={winner}
              onChange={(e) => setWinner(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select…</option>
              <option value="none">אף אחד (no one)</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <p className="text-xs text-gray-400">
            Resolving will calculate points for all bets on this episode and mark it as resolved.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-green-600 text-white rounded-lg px-4 py-2 font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Resolving…' : 'Resolve episode'}
          </button>
        </form>
      </div>
    </div>
  );
}
