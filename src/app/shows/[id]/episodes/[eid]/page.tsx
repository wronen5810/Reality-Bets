'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Episode, Participant, Bet } from '@/lib/types';
import { format } from 'date-fns';

export default function BetPage() {
  const { id, eid } = useParams<{ id: string; eid: string }>();
  const router = useRouter();

  const [episode, setEpisode] = useState<Episode | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [existing, setExisting] = useState<Bet | null>(null);
  const [eliminated, setEliminated] = useState('');
  const [winner, setWinner] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/shows/${id}/episodes/${eid}`).then((r) => r.json()),
      fetch(`/api/shows/${id}/participants`).then((r) => r.json()),
      fetch(`/api/bets/${eid}`).then((r) => r.json()),
    ]).then(([ep, parts, bet]) => {
      setEpisode(ep);
      setParticipants(parts.filter((p: Participant) => p.is_active));
      if (bet) {
        setExisting(bet);
        setEliminated(bet.eliminated_participant_id);
        setWinner(bet.winner_participant_id);
      }
      setLoading(false);
    });
  }, [id, eid]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ episode_id: eid, eliminated_participant_id: eliminated, winner_participant_id: winner }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? 'Failed to save bet');
    } else {
      router.push(`/shows/${id}`);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;
  if (!episode) return <div className="min-h-screen flex items-center justify-center text-red-500">Episode not found</div>;

  const isLocked = new Date(episode.air_datetime) <= new Date();

  if (isLocked || episode.status === 'resolved') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8 max-w-sm w-full text-center">
          <p className="text-gray-500 mb-4">Betting is closed for this episode.</p>
          <Link href={`/shows/${id}`} className="text-indigo-600 hover:underline">Back to show</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow p-8 max-w-md w-full">
        <Link href={`/shows/${id}`} className="text-sm text-indigo-600 hover:underline mb-4 inline-block">← Back</Link>
        <h1 className="text-xl font-bold mb-1">
          Episode {episode.episode_number}{episode.title ? `: ${episode.title}` : ''}
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          Airs {format(new Date(episode.air_datetime), 'MMM d, yyyy HH:mm')} — bets lock at air time
        </p>
        {existing && <p className="text-sm text-green-600 mb-4">You already placed a bet. You can update it below.</p>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Who gets eliminated?</label>
            <select
              required
              value={eliminated}
              onChange={(e) => setEliminated(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select participant…</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Who wins the episode?</label>
            <select
              required
              value={winner}
              onChange={(e) => setWinner(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select participant…</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2 font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : existing ? 'Update bet' : 'Place bet'}
          </button>
        </form>
      </div>
    </div>
  );
}
