'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { GroupProvider, useGroup } from './GroupContext';

function GroupPicker() {
  const { groups, selectedGroup, setSelectedGroupId, loading } = useGroup();
  if (loading || groups.length <= 1) return null;
  return (
    <select
      value={selectedGroup?.id ?? ''}
      onChange={(e) => setSelectedGroupId(e.target.value)}
      className="text-sm bg-indigo-600 border border-indigo-400 text-white rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-white"
    >
      {groups.map((g) => (
        <option key={g.id} value={g.id} className="text-gray-900 bg-white">{g.name}</option>
      ))}
    </select>
  );
}

function NavInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedGroup, loading } = useGroup();

  async function signOut() {
    await createBrowserSupabase().auth.signOut();
    router.push('/login');
  }

  const nav = [
    { href: '/group-admin', label: 'Dashboard' },
    { href: '/group-admin/shows', label: 'Shows' },
    { href: '/group-admin/users', label: 'Members' },
    { href: '/group-admin/participants', label: 'Participants' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-indigo-700 text-white px-4 py-3 flex items-center gap-4 flex-wrap">
        <span className="font-bold whitespace-nowrap">
          {loading ? 'My Group' : (selectedGroup?.name ?? 'My Group')}
        </span>
        <GroupPicker />
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`text-sm hover:text-indigo-200 whitespace-nowrap ${pathname === n.href ? 'font-semibold underline' : ''}`}
          >
            {n.label}
          </Link>
        ))}
        <div className="ml-auto">
          <button onClick={signOut} className="text-sm hover:text-indigo-200">Sign out</button>
        </div>
      </nav>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

export default function GroupAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <GroupProvider>
      <NavInner>{children}</NavInner>
    </GroupProvider>
  );
}
