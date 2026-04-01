export const dynamic = 'force-dynamic';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { createServiceSupabase } from '@/lib/supabase-server';
import { getUserGroupIds } from '@/lib/auth';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Show } from '@/lib/types';

export default async function HomePage() {
  const cookieStore = await cookies();
  const anonClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c: { name: string; value: string; options?: object }[]) =>
          c.forEach(({ name, value, options }) => cookieStore.set(name, value, options as never)),
      },
    }
  );
  const { data: { user } } = await anonClient.auth.getUser();

  const supabase = createServiceSupabase();
  let shows: Show[] = [];
  let noGroup = false;

  if (user?.email === process.env.ADMIN_EMAIL) {
    const { data } = await supabase.from('shows').select('*').eq('is_active', true).order('created_at', { ascending: false });
    shows = (data as Show[]) ?? [];
  } else if (user?.email) {
    const groupIds = await getUserGroupIds(user.email);
    if (!groupIds.length) {
      noGroup = true;
    } else {
      const { data: showLinks } = await supabase
        .from('show_groups')
        .select('show_id')
        .in('group_id', groupIds);
      const showIds = (showLinks ?? []).map((r: { show_id: string }) => r.show_id);
      if (showIds.length) {
        const { data } = await supabase
          .from('shows')
          .select('*')
          .in('id', showIds)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        shows = (data as Show[]) ?? [];
      }
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Active Shows</h1>
        {noGroup && (
          <p className="text-gray-500">You are not assigned to a group yet. Contact your administrator.</p>
        )}
        {!noGroup && !shows?.length && (
          <p className="text-gray-500">No active shows at the moment. Check back soon!</p>
        )}
        <div className="space-y-4">
          {(shows as Show[])?.map((show) => (
            <Link
              key={show.id}
              href={`/shows/${show.id}`}
              className="block bg-white rounded-xl shadow p-5 hover:shadow-md transition"
            >
              <h2 className="text-lg font-semibold">{show.name}</h2>
              {show.description && <p className="text-gray-500 mt-1 text-sm">{show.description}</p>}
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
