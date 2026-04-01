'use client';
import { useEffect, useState } from 'react';
import type { Show } from '@/lib/types';
import { useGroup } from '../GroupContext';

export default function GroupAdminShowsPage() {
  const { selectedGroup, loading: groupLoading } = useGroup();
  const [linkedShows, setLinkedShows] = useState<Show[]>([]);
  const [availableShows, setAvailableShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  async function load(groupId: string) {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/group-admin/shows?group_id=${groupId}`);
    if (res.ok) {
      const data = await res.json();
      setLinkedShows(data.linkedShows ?? []);
      setAvailableShows(data.availableShows ?? []);
    } else {
      setError('Failed to load shows');
    }
    setLoading(false);
  }

  useEffect(() => {
    if (selectedGroup) load(selectedGroup.id);
  }, [selectedGroup?.id]);

  async function linkShow(showId: string) {
    if (!selectedGroup) return;
    setActionLoading(true);
    await fetch('/api/group-admin/shows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: selectedGroup.id, show_id: showId }),
    });
    setActionLoading(false);
    load(selectedGroup.id);
  }

  async function unlinkShow(showId: string) {
    if (!selectedGroup) return;
    if (!confirm('Remove this show from your group?')) return;
    setActionLoading(true);
    await fetch('/api/group-admin/shows', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: selectedGroup.id, show_id: showId }),
    });
    setActionLoading(false);
    load(selectedGroup.id);
  }

  if (groupLoading) return <p className="text-gray-400 text-sm">Loading…</p>;
  if (!selectedGroup) return <p className="text-gray-500">No group selected.</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Shows</h1>
      <p className="text-sm text-gray-500 mb-6">Manage shows visible to <span className="font-medium text-gray-700">{selectedGroup.name}</span> members.</p>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <>
          {/* Linked shows */}
          <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
            <div className="px-5 py-3 bg-gray-50 border-b">
              <h2 className="font-semibold text-sm text-gray-700">Linked Shows ({linkedShows.length})</h2>
            </div>
            {!linkedShows.length ? (
              <p className="px-5 py-4 text-sm text-gray-400">No shows linked yet. Add one below.</p>
            ) : (
              <div className="divide-y">
                {linkedShows.map((show) => (
                  <div key={show.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{show.name}</p>
                      {show.description && <p className="text-xs text-gray-400">{show.description}</p>}
                    </div>
                    <button
                      onClick={() => unlinkShow(show.id)}
                      disabled={actionLoading}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available shows to link */}
          {availableShows.length > 0 && (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b">
                <h2 className="font-semibold text-sm text-gray-700">Available Shows</h2>
              </div>
              <div className="divide-y">
                {availableShows.map((show) => (
                  <div key={show.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{show.name}</p>
                      {show.description && <p className="text-xs text-gray-400">{show.description}</p>}
                    </div>
                    <button
                      onClick={() => linkShow(show.id)}
                      disabled={actionLoading}
                      className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!availableShows.length && linkedShows.length > 0 && (
            <p className="text-sm text-gray-400">All active shows are already linked to this group.</p>
          )}
        </>
      )}
    </div>
  );
}
