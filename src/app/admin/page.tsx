import Link from 'next/link';
import { createServiceSupabase } from '@/lib/supabase-server';

export default async function AdminDashboard() {
  const supabase = createServiceSupabase();
  const [{ count: showsCount }, { count: usersCount }, { count: betsCount }] = await Promise.all([
    supabase.from('shows').select('*', { count: 'exact', head: true }),
    supabase.from('allowed_users').select('*', { count: 'exact', head: true }),
    supabase.from('bets').select('*', { count: 'exact', head: true }),
  ]);

  const cards = [
    { label: 'Shows', count: showsCount ?? 0, href: '/admin/shows' },
    { label: 'Users', count: usersCount ?? 0, href: '/admin/users' },
    { label: 'Total Bets', count: betsCount ?? 0, href: '/admin/shows' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="bg-white rounded-xl shadow p-6 hover:shadow-md transition text-center">
            <p className="text-3xl font-bold text-indigo-600">{c.count}</p>
            <p className="text-gray-500 text-sm mt-1">{c.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
