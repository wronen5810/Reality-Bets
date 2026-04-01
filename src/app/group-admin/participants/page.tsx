'use client';
import { useEffect, useState } from 'react';
import type { Participant, Show } from '@/lib/types';

export default function GroupAdminParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [selectedShowId, setSelectedShowId] = useState('');
  const [loading, setLoading] = useState(true);

  // Add form
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  async function load() {
    const [participantsRes, infoRes] = await Promise.all([
      fetch('/api/group-admin/participants'),
      fetch('/api/group-admin/info'),
    ]);

    if (participantsRes.ok) setParticipants(await participantsRes.json());
    if (infoRes.ok) {
      const groups = await infoRes.json();
      const allShows: Show[] = [];
      for (const g of groups) {
        for (const s of g.shows) {
          if (!allShows.find((x) => x.id === s.id)) allShows.push(s);
        }
      }
      setShows(allShows);
      if (allShows.length && !selectedShowId) setSelectedShowId(allShows[0].id);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setAdding(true);
    const res = await fetch('/api/group-admin/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ show_id: selectedShowId, name, photo_url: photoUrl || null }),
    });
    setAdding(false);
    if (!res.ok) {
      setAddError((await res.json()).error ?? 'Failed to add participant');
    } else {
      setName('');
      setPhotoUrl('');
      load();
    }
  }

  async function handleToggleActive(p: Participant) {
    await fetch(`/api/group-admin/participants/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this participant?')) return;
    await fetch(`/api/group-admin/participants/${id}`, { method: 'DELETE' });
    load();
  }

  const inputCls = 'border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const filtered = participants.filter((p) => p.show_id === selectedShowId);

  if (loading) return <p className="text-gray-400 text-sm">Loading…</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Participants</h1>

      {!shows.length && <p className="text-gray-500">No shows linked to your group yet.</p>}

      {shows.length > 0 && (
        <>
          {/* Show selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Show</label>
            <select
              value={selectedShowId}
              onChange={(e) => setSelectedShowId(e.target.value)}
              className={inputCls}
            >
              {shows.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Add participant form */}
          <form onSubmit={handleAdd} className="bg-white rounded-xl shadow p-5 mb-6 space-y-3">
            <h2 className="font-semibold">Add participant</h2>
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className={inputCls}
              />
              <input
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Photo URL (optional)"
                className={inputCls}
              />
            </div>
            {addError && <p className="text-red-600 text-sm">{addError}</p>}
            <button
              type="submit"
              disabled={adding}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {adding ? 'Adding…' : 'Add participant'}
            </button>
          </form>

          {/* Participants list */}
          <div className="space-y-3">
            {!filtered.length && <p className="text-gray-400 text-sm">No participants for this show.</p>}
            {filtered.map((p) => (
              <div key={p.id} className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
                {p.photo_url && (
                  <img src={p.photo_url} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                )}
                {!p.photo_url && (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-bold">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{p.name}</p>
                </div>
                <button
                  onClick={() => handleToggleActive(p)}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                >
                  {p.is_active ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
