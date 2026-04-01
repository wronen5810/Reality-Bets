'use client';
import { useEffect, useState } from 'react';
import type { GroupWithCounts, GroupMemberWithDisplay, Show } from '@/lib/types';

interface ExpandedGroup {
  members: GroupMemberWithDisplay[];
  shows: Show[];
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<GroupWithCounts[]>([]);
  const [allShows, setAllShows] = useState<Show[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<ExpandedGroup | null>(null);
  const [loadingExpanded, setLoadingExpanded] = useState(false);

  // Per-group form state
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberRole, setAddMemberRole] = useState<'admin' | 'member'>('member');
  const [addMemberError, setAddMemberError] = useState('');
  const [linkShowId, setLinkShowId] = useState('');
  const [linkShowError, setLinkShowError] = useState('');

  async function loadGroups() {
    const res = await fetch('/api/admin/groups');
    if (res.ok) setGroups(await res.json());
  }

  async function loadAllShows() {
    const res = await fetch('/api/shows');
    if (res.ok) setAllShows(await res.json());
  }

  useEffect(() => {
    loadGroups();
    loadAllShows();
  }, []);

  async function expandGroup(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedData(null);
      return;
    }
    setExpandedId(id);
    setExpandedData(null);
    setLoadingExpanded(true);
    setAddMemberEmail('');
    setAddMemberRole('member');
    setAddMemberError('');
    setLinkShowId('');
    setLinkShowError('');

    const [membersRes, showsRes] = await Promise.all([
      fetch(`/api/admin/groups/${id}/members`),
      fetch(`/api/admin/groups/${id}/shows`),
    ]);
    const members = membersRes.ok ? await membersRes.json() : [];
    const shows = showsRes.ok ? await showsRes.json() : [];
    setExpandedData({ members, shows });
    setLoadingExpanded(false);
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    const res = await fetch('/api/admin/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGroupName }),
    });
    setCreating(false);
    if (!res.ok) {
      setCreateError((await res.json()).error ?? 'Failed to create group');
    } else {
      setNewGroupName('');
      loadGroups();
    }
  }

  async function handleDeleteGroup(id: string, name: string) {
    if (!confirm(`Delete group "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/groups/${id}`, { method: 'DELETE' });
    if (expandedId === id) { setExpandedId(null); setExpandedData(null); }
    loadGroups();
  }

  async function handleUpdateRole(groupId: string, email: string, newRole: 'admin' | 'member') {
    await fetch(`/api/admin/groups/${groupId}/members/${encodeURIComponent(email)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    await reloadExpanded(groupId);
  }

  async function handleRemoveMember(groupId: string, email: string) {
    if (!confirm(`Remove ${email} from group?`)) return;
    await fetch(`/api/admin/groups/${groupId}/members/${encodeURIComponent(email)}`, { method: 'DELETE' });
    await reloadExpanded(groupId);
    loadGroups();
  }

  async function handleAddMember(e: React.FormEvent, groupId: string) {
    e.preventDefault();
    setAddMemberError('');
    const res = await fetch(`/api/admin/groups/${groupId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: addMemberEmail, role: addMemberRole }),
    });
    if (!res.ok) {
      setAddMemberError((await res.json()).error ?? 'Failed to add member');
    } else {
      setAddMemberEmail('');
      setAddMemberRole('member');
      await reloadExpanded(groupId);
      loadGroups();
    }
  }

  async function handleUnlinkShow(groupId: string, showId: string) {
    await fetch(`/api/admin/groups/${groupId}/shows`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ show_id: showId }),
    });
    await reloadExpanded(groupId);
    loadGroups();
  }

  async function handleLinkShow(e: React.FormEvent, groupId: string) {
    e.preventDefault();
    setLinkShowError('');
    const res = await fetch(`/api/admin/groups/${groupId}/shows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ show_id: linkShowId }),
    });
    if (!res.ok) {
      setLinkShowError((await res.json()).error ?? 'Failed to link show');
    } else {
      setLinkShowId('');
      await reloadExpanded(groupId);
      loadGroups();
    }
  }

  async function reloadExpanded(groupId: string) {
    const [membersRes, showsRes] = await Promise.all([
      fetch(`/api/admin/groups/${groupId}/members`),
      fetch(`/api/admin/groups/${groupId}/shows`),
    ]);
    const members = membersRes.ok ? await membersRes.json() : [];
    const shows = showsRes.ok ? await showsRes.json() : [];
    setExpandedData({ members, shows });
  }

  const inputCls = 'border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const btnCls = 'bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50';

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Groups</h1>

      {/* Create group */}
      <form onSubmit={handleCreateGroup} className="bg-white rounded-xl shadow p-5 mb-6 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">New group name</label>
          <input
            required
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name"
            className={`${inputCls} w-full`}
          />
          {createError && <p className="text-red-600 text-xs mt-1">{createError}</p>}
        </div>
        <button type="submit" disabled={creating} className={btnCls}>
          {creating ? 'Creating…' : 'Create group'}
        </button>
      </form>

      {/* Groups list */}
      <div className="space-y-4">
        {!groups.length && <p className="text-gray-400 text-sm">No groups yet.</p>}
        {groups.map((group) => (
          <div key={group.id} className="bg-white rounded-xl shadow overflow-hidden">
            {/* Group header */}
            <div
              className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => expandGroup(group.id)}
            >
              <div>
                <h2 className="font-semibold text-lg">{group.name}</h2>
                <p className="text-sm text-gray-400">
                  {group.member_count} member{group.member_count !== 1 ? 's' : ''} &middot; {group.show_count} show{group.show_count !== 1 ? 's' : ''}
                </p>
              </div>
              <span className="text-gray-400 text-sm">{expandedId === group.id ? '▲' : '▼'}</span>
            </div>

            {/* Expanded content */}
            {expandedId === group.id && (
              <div className="border-t px-5 py-4 space-y-6">
                {loadingExpanded && <p className="text-sm text-gray-400">Loading…</p>}

                {expandedData && (
                  <>
                    {/* Members section */}
                    <div>
                      <h3 className="font-medium text-sm text-gray-700 mb-2">Members</h3>
                      {!expandedData.members.length && (
                        <p className="text-sm text-gray-400 mb-2">No members yet.</p>
                      )}
                      <div className="space-y-2 mb-3">
                        {expandedData.members.map((m) => (
                          <div key={m.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                            <div>
                              <span className="font-medium">{m.display_name ?? m.user_email}</span>
                              <span className="text-gray-400 ml-2">{m.user_email}</span>
                              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${m.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                                {m.role}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateRole(group.id, m.user_email, m.role === 'admin' ? 'member' : 'admin')}
                                className="text-xs text-indigo-600 hover:underline"
                              >
                                {m.role === 'admin' ? 'Make Member' : 'Make Admin'}
                              </button>
                              <button
                                onClick={() => handleRemoveMember(group.id, m.user_email)}
                                className="text-xs text-red-500 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add member form */}
                      <form onSubmit={(e) => handleAddMember(e, group.id)} className="flex gap-2 items-end">
                        <input
                          required
                          value={addMemberEmail}
                          onChange={(e) => setAddMemberEmail(e.target.value)}
                          placeholder="email@example.com"
                          type="email"
                          className={inputCls}
                        />
                        <select
                          value={addMemberRole}
                          onChange={(e) => setAddMemberRole(e.target.value as 'admin' | 'member')}
                          className={inputCls}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button type="submit" className={btnCls}>Add</button>
                      </form>
                      {addMemberError && <p className="text-red-600 text-xs mt-1">{addMemberError}</p>}
                    </div>

                    {/* Shows section */}
                    <div>
                      <h3 className="font-medium text-sm text-gray-700 mb-2">Linked Shows</h3>
                      {!expandedData.shows.length && (
                        <p className="text-sm text-gray-400 mb-2">No shows linked.</p>
                      )}
                      <div className="space-y-2 mb-3">
                        {expandedData.shows.map((s) => (
                          <div key={s.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                            <span className="font-medium">{s.name}</span>
                            <button
                              onClick={() => handleUnlinkShow(group.id, s.id)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Unlink
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Link show form */}
                      <form onSubmit={(e) => handleLinkShow(e, group.id)} className="flex gap-2 items-end">
                        <select
                          required
                          value={linkShowId}
                          onChange={(e) => setLinkShowId(e.target.value)}
                          className={inputCls}
                        >
                          <option value="">Select a show…</option>
                          {allShows
                            .filter((s) => !expandedData.shows.find((gs) => gs.id === s.id))
                            .map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <button type="submit" className={btnCls}>Link</button>
                      </form>
                      {linkShowError && <p className="text-red-600 text-xs mt-1">{linkShowError}</p>}
                    </div>

                    {/* Delete group */}
                    <div className="pt-2 border-t">
                      <button
                        onClick={() => handleDeleteGroup(group.id, group.name)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
                      >
                        Delete Group
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
