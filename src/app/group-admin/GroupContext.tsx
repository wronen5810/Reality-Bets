'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { GroupWithDetails } from '@/lib/types';

interface GroupContextValue {
  groups: GroupWithDetails[];
  selectedGroup: GroupWithDetails | null;
  setSelectedGroupId: (id: string) => void;
  loading: boolean;
  reload: () => void;
}

const GroupContext = createContext<GroupContextValue>({
  groups: [],
  selectedGroup: null,
  setSelectedGroupId: () => {},
  loading: true,
  reload: () => {},
});

export function useGroup() {
  return useContext(GroupContext);
}

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<GroupWithDetails[]>([]);
  const [selectedGroupId, setSelectedGroupIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function setSelectedGroupId(id: string) {
    setSelectedGroupIdState(id);
    if (typeof window !== 'undefined') localStorage.setItem('group_admin_selected_group', id);
  }

  async function reload() {
    setLoading(true);
    const res = await fetch('/api/group-admin/info');
    if (res.ok) {
      const data: GroupWithDetails[] = await res.json();
      setGroups(data);
      // Auto-select: restore from localStorage or pick the first group
      const stored = typeof window !== 'undefined' ? localStorage.getItem('group_admin_selected_group') : null;
      const validStored = stored && data.some((g) => g.id === stored);
      if (validStored) {
        setSelectedGroupIdState(stored);
      } else if (data.length === 1) {
        setSelectedGroupIdState(data[0].id);
      } else if (data.length > 1 && !validStored) {
        setSelectedGroupIdState(data[0].id);
      }
    }
    setLoading(false);
  }

  useEffect(() => { reload(); }, []);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;

  return (
    <GroupContext.Provider value={{ groups, selectedGroup, setSelectedGroupId, loading, reload }}>
      {children}
    </GroupContext.Provider>
  );
}
