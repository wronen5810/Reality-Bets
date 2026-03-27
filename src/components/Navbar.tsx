'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';

export default function Navbar() {
  const router = useRouter();

  async function signOut() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <nav className="bg-white border-b px-4 py-3 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg text-indigo-600">Reality Bets</Link>
      <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-800">Sign out</button>
    </nav>
  );
}
