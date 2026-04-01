'use client';
import { useGroup } from './GroupContext';
import Link from 'next/link';

export default function GroupAdminPage() {
  const { selectedGroup, groups, loading } = useGroup();

  if (loading) return <p className="text-gray-400 text-sm">Loading…</p>;
  if (!groups.length) return <p className="text-gray-500">You are not an admin of any group.</p>;
  if (!selectedGroup) return <p className="text-gray-500">Select a group above.</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">{selectedGroup.name}</h1>
      <p className="text-sm text-gray-500 mb-6">Group overview</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Link href="/group-admin/users" className="bg-white rounded-xl shadow p-5 hover:shadow-md transition text-center">
          <p className="text-3xl font-bold text-indigo-600">{selectedGroup.members.length}</p>
          <p className="text-gray-500 text-sm mt-1">Members</p>
        </Link>
        <Link href="/group-admin/shows" className="bg-white rounded-xl shadow p-5 hover:shadow-md transition text-center">
          <p className="text-3xl font-bold text-indigo-600">{selectedGroup.shows.length}</p>
          <p className="text-gray-500 text-sm mt-1">Linked Shows</p>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow p-5 mb-4">
        <h2 className="font-semibold text-sm text-gray-700 mb-3">Members</h2>
        {!selectedGroup.members.length && <p className="text-sm text-gray-400">No members yet.</p>}
        <div className="space-y-1">
          {selectedGroup.members.map((m) => (
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

      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="font-semibold text-sm text-gray-700 mb-3">Linked Shows</h2>
        {!selectedGroup.shows.length && <p className="text-sm text-gray-400">No shows linked. <Link href="/group-admin/shows" className="text-indigo-600 hover:underline">Add one →</Link></p>}
        <div className="space-y-1">
          {selectedGroup.shows.map((s) => (
            <div key={s.id} className="text-sm bg-gray-50 rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="font-medium">{s.name}</span>
              {s.description && <span className="text-gray-400 text-xs">{s.description}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
