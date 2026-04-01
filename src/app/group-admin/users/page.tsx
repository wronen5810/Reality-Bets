'use client';
import { useEffect, useState } from 'react';
import type { GroupMemberWithDisplay, GroupWithDetails } from '@/lib/types';

export default function GroupAdminUsersPage() {
  const [members, setMembers] = useState<GroupMemberWithDisplay[]>([]);
  const [groups, setGroups] = useState<GroupWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Add user form
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [groupId, setGroupId] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  async function load() {
    const [membersRes, infoRes] = await Promise.all([
      fetch('/api/group-admin/users'),
      fetch('/api/group-admin/info'),
    ]);
    if (membersRes.ok) setMembers(await membersRes.json());
    if (infoRes.ok) {
      const data = await infoRes.json();
      setGroups(data);
      if (data.length && !groupId) setGroupId(data[0].id);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setAdding(true);
    const res = await fetch('/api/group-admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: email, display_name: displayName, role, group_id: groupId }),
    });
    setAdding(false);
    if (!res.ok) {
      setAddError((await res.json()).error ?? 'Failed to add user');
    } else {
      setEmail('');
      setDisplayName('');
      setRole('member');
      load();
    }
  }

  async function handleToggleRole(m: GroupMemberWithDisplay) {
    const newRole = m.role === 'admin' ? 'member' : 'admin';
    await fetch(`/api/group-admin/users/${encodeURIComponent(m.user_email)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole, group_id: m.group_id }),
    });
    load();
  }

  async function handleRemove(m: GroupMemberWithDisplay) {
    if (!confirm(`Remove ${m.user_email} from group?`)) return;
    await fetch(`/api/group-admin/users/${encodeURIComponent(m.user_email)}?group_id=${m.group_id}`, {
      method: 'DELETE',
    });
    load();
  }

  const inputCls = 'border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  if (loading) return <p className="text-gray-400 text-sm">Loading…</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Members</h1>

      <form onSubmit={handleAdd} className="bg-white rounded-xl shadow p-5 mb-6 space-y-3">
        <h2 className="font-semibold">Add member</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className={inputCls}
          />
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display name (optional)"
            className={inputCls}
          />
        </div>
        <div className="flex gap-3">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
            className={inputCls}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          {groups.length > 1 && (
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className={inputCls}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          )}
        </div>
        {addError && <p className="text-red-600 text-sm">{addError}</p>}
        <button
          type="submit"
          disabled={adding}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {adding ? 'Adding…' : 'Add member'}
        </button>
      </form>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 font-medium">{m.display_name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{m.user_email}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleRole(m)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {m.role}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleRemove(m)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                </td>
              </tr>
            ))}
            {!members.length && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No members yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
