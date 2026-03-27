export const dynamic = 'force-dynamic';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { createServiceSupabase } from '@/lib/supabase-server';
import type { Show } from '@/lib/types';

export default async function HomePage() {
  const supabase = createServiceSupabase();
  const { data: shows } = await supabase.from('shows').select('*').eq('is_active', true).order('created_at', { ascending: false });

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Active Shows</h1>
        {!shows?.length && (
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
