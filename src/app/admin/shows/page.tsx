'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Show } from '@/lib/types';

export default function AdminShowsPage() {
  const [shows, setShows] = useState<Show[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch('/api/shows');
    setShows(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/shows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    setLoading(false);
    if (!res.ok) {
      setError((await res.json()).error ?? 'Failed');
    } else {
      setName('');
      setDescription('');
      load();
    }
  }

  async function toggleActive(show: Show) {
    await fetch(`/api/shows/${show.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !show.is_active }),
    });
    load();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Shows</h1>

      <form onSubmit={handleAdd} className="bg-white rounded-xl shadow p-5 mb-6 space-y-3">
        <h2 className="font-semibold">Create show</h2>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Show name"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create show'}
        </button>
      </form>

      <div className="space-y-3">
        {shows.map((show) => (
          <div key={show.id} className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
            <div>
              <Link href={`/admin/shows/${show.id}`} className="font-semibold hover:text-indigo-600">
                {show.name}
              </Link>
              {show.description && <p className="text-sm text-gray-400">{show.description}</p>}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleActive(show)}
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${show.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
              >
                {show.is_active ? 'Active' : 'Inactive'}
              </button>
              <Link href={`/admin/shows/${show.id}`} className="text-sm text-indigo-600 hover:underline">
                Manage →
              </Link>
            </div>
          </div>
        ))}
        {!shows.length && <p className="text-gray-400 text-sm">No shows yet.</p>}
      </div>
    </div>
  );
}
