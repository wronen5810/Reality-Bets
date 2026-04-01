'use client';
import { useEffect, useState } from 'react';
import type { GroupWithDetails } from '@/lib/types';

export default function GroupAdminPage() {
  const [groups, setGroups] = useState<GroupWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/group-admin/info')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load group info');
        return res.json();
      })
      .then((data) => {
        setGroups(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-gray-400 text-sm">Loading…</p>;
  if (error) return <p className="text-red-500 text-sm">{error}</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Group Overview</h1>
      {!groups.length && <p className="text-gray-500">You are not an admin of any group.</p>}
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.id} className="bg-white rounded-xl shadow p-5">
            <h2 className="text-lg font-semibold mb-3">{group.name}</h2>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Members</h3>
              {!group.members.length && <p className="text-sm text-gray-400">No members yet.</p>}
              <div className="space-y-1">
                {group.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                    <span className="font-medium">{m.display_name ?? m.user_email}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">{m.user_email}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                        {m.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Linked Shows</h3>
              {!group.shows.length && <p className="text-sm text-gray-400">No shows linked.</p>}
              <div className="space-y-1">
                {group.shows.map((s) => (
                  <div key={s.id} className="text-sm bg-gray-50 rounded-lg px-3 py-2">
                    <span className="font-medium">{s.name}</span>
                    {s.description && <span className="text-gray-400 ml-2">{s.description}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
