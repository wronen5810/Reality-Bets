'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Show, Participant, Episode } from '@/lib/types';
import { format } from 'date-fns';

export default function AdminShowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [show, setShow] = useState<Show | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  // Participant form
  const [pName, setPName] = useState('');
  const [pLoading, setPLoading] = useState(false);

  // Episode form
  const [epNumber, setEpNumber] = useState('');
  const [epTitle, setEpTitle] = useState('');
  const [epDatetime, setEpDatetime] = useState('');
  const [epLoading, setEpLoading] = useState(false);

  async function load() {
    const [s, p, e] = await Promise.all([
      fetch(`/api/shows/${id}`).then((r) => r.json()),
      fetch(`/api/shows/${id}/participants`).then((r) => r.json()),
      fetch(`/api/shows/${id}/episodes`).then((r) => r.json()),
    ]);
    setShow(s);
    setParticipants(p);
    setEpisodes(e);
  }

  useEffect(() => { load(); }, [id]);

  async function addParticipant(e: React.FormEvent) {
    e.preventDefault();
    setPLoading(true);
    await fetch(`/api/shows/${id}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: pName }),
    });
    setPName('');
    setPLoading(false);
    load();
  }

  async function toggleParticipant(p: Participant) {
    await fetch(`/api/shows/${id}/participants/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    load();
  }

  async function addEpisode(e: React.FormEvent) {
    e.preventDefault();
    setEpLoading(true);
    await fetch(`/api/shows/${id}/episodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        episode_number: Number(epNumber),
        title: epTitle || null,
        air_datetime: new Date(epDatetime).toISOString(),
      }),
    });
    setEpNumber('');
    setEpTitle('');
    setEpDatetime('');
    setEpLoading(false);
    load();
  }

  if (!show) return <div className="text-gray-400 p-8">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link href="/admin/shows" className="text-sm text-indigo-600 hover:underline">← Shows</Link>
        <h1 className="text-2xl font-bold mt-1">{show.name}</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Participants */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Participants</h2>
          <form onSubmit={addParticipant} className="flex gap-2">
            <input
              required
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              placeholder="Participant name"
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={pLoading}
              className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              Add
            </button>
          </form>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y">
                {participants.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleParticipant(p)}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {p.is_active ? 'Active' : 'Eliminated'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!participants.length && (
                  <tr><td className="px-4 py-4 text-center text-gray-400">No participants yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Episodes */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Episodes</h2>
          <form onSubmit={addEpisode} className="bg-white rounded-xl shadow p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                type="number"
                min="1"
                value={epNumber}
                onChange={(e) => setEpNumber(e.target.value)}
                placeholder="Episode #"
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                value={epTitle}
                onChange={(e) => setEpTitle(e.target.value)}
                placeholder="Title (optional)"
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <input
              required
              type="datetime-local"
              value={epDatetime}
              onChange={(e) => setEpDatetime(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={epLoading}
              className="w-full bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {epLoading ? 'Adding…' : 'Add episode'}
            </button>
          </form>

          <div className="space-y-2">
            {episodes.map((ep) => (
              <div key={ep.id} className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Ep {ep.episode_number}{ep.title ? `: ${ep.title}` : ''}</p>
                  <p className="text-xs text-gray-400">{format(new Date(ep.air_datetime), 'MMM d, yyyy HH:mm')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ep.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {ep.status}
                  </span>
                  {ep.status !== 'resolved' && (
                    <Link
                      href={`/admin/shows/${id}/episodes/${ep.id}`}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Resolve
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {!episodes.length && <p className="text-gray-400 text-sm">No episodes yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
