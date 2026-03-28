'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Show, Participant, Episode } from '@/lib/types';
import { format } from 'date-fns';

function PhotoPreview({ url }: { url: string }) {
  if (!url) return <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-lg">👤</div>;
  return <img src={url} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />;
}

export default function AdminShowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [show, setShow] = useState<Show | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  // Add participant form
  const [pName, setPName] = useState('');
  const [pPhoto, setPPhoto] = useState('');
  const [pLoading, setPLoading] = useState(false);

  // Edit state: participantId → {name, photo_url}
  const [editing, setEditing] = useState<Record<string, { name: string; photo_url: string }>>({});

  // Fetch loading
  const [fetching, setFetching] = useState(false);
  const [fetchMsg, setFetchMsg] = useState('');

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
      body: JSON.stringify({ name: pName, photo_url: pPhoto || null }),
    });
    setPName('');
    setPPhoto('');
    setPLoading(false);
    load();
  }

  function startEdit(p: Participant) {
    setEditing((prev) => ({ ...prev, [p.id]: { name: p.name, photo_url: p.photo_url ?? '' } }));
  }

  function cancelEdit(id: string) {
    setEditing((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }

  async function saveEdit(p: Participant) {
    const ed = editing[p.id];
    await fetch(`/api/shows/${id}/participants/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: ed.name, photo_url: ed.photo_url || null }),
    });
    cancelEdit(p.id);
    load();
  }

  async function deleteParticipant(pid: string) {
    if (!confirm('Delete this participant?')) return;
    await fetch(`/api/shows/${id}/participants/${pid}`, { method: 'DELETE' });
    load();
  }

  async function fetchParticipants() {
    if (!show) return;
    setFetching(true);
    setFetchMsg('');
    const res = await fetch(`/api/admin/shows/${id}/fetch-participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showName: show.name }),
    });
    if (!res.ok) {
      const j = await res.json();
      setFetchMsg(j.error ?? 'Not found');
      setFetching(false);
      return;
    }
    const fetched: { name: string; photo_url: string | null }[] = await res.json();
    // Insert all fetched participants
    await Promise.all(fetched.map((p) =>
      fetch(`/api/shows/${id}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      })
    ));
    setFetchMsg(`Added ${fetched.length} participants`);
    setFetching(false);
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Participants</h2>
            <button
              onClick={fetchParticipants}
              disabled={fetching}
              className="text-sm bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 disabled:opacity-50"
            >
              {fetching ? 'Fetching…' : '✦ Auto-fetch'}
            </button>
          </div>
          {fetchMsg && <p className="text-sm text-green-600">{fetchMsg}</p>}

          {/* Add participant */}
          <form onSubmit={addParticipant} className="bg-white rounded-xl shadow p-3 space-y-2">
            <input
              required
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              placeholder="Name"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2 items-center">
              <input
                value={pPhoto}
                onChange={(e) => setPPhoto(e.target.value)}
                placeholder="Photo URL (optional)"
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {pPhoto && <PhotoPreview url={pPhoto} />}
            </div>
            <button
              type="submit"
              disabled={pLoading}
              className="w-full bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {pLoading ? 'Adding…' : 'Add participant'}
            </button>
          </form>

          {/* Participant list */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {!participants.length && (
              <p className="px-4 py-4 text-center text-gray-400 text-sm">No participants yet</p>
            )}
            {participants.map((p) => {
              const ed = editing[p.id];
              return (
                <div key={p.id} className="border-b last:border-0 px-4 py-3">
                  {ed ? (
                    <div className="space-y-2">
                      <input
                        value={ed.name}
                        onChange={(e) => setEditing((prev) => ({ ...prev, [p.id]: { ...prev[p.id], name: e.target.value } }))}
                        className="w-full border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex gap-2 items-center">
                        <input
                          value={ed.photo_url}
                          onChange={(e) => setEditing((prev) => ({ ...prev, [p.id]: { ...prev[p.id], photo_url: e.target.value } }))}
                          placeholder="Photo URL"
                          className="flex-1 border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {ed.photo_url && <PhotoPreview url={ed.photo_url} />}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(p)} className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700">Save</button>
                        <button onClick={() => cancelEdit(p.id)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <PhotoPreview url={p.photo_url ?? ''} />
                      <span className={`flex-1 text-sm font-medium ${!p.is_active ? 'line-through text-gray-400' : ''}`} dir="rtl">{p.name}</span>
                      <div className="flex gap-2 shrink-0 items-center">
                        <button
                          onClick={async () => {
                            await fetch(`/api/shows/${id}/participants/${p.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ is_active: !p.is_active }),
                            });
                            load();
                          }}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}
                        >
                          {p.is_active ? 'Active' : 'Eliminated'}
                        </button>
                        <button onClick={() => startEdit(p)} className="text-xs text-indigo-600 hover:underline">Edit</button>
                        <button onClick={() => deleteParticipant(p.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
                    <Link href={`/admin/shows/${id}/episodes/${ep.id}`} className="text-xs text-indigo-600 hover:underline">
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
