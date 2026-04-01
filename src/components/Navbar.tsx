'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase-browser';

export default function Navbar() {
  const router = useRouter();
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/group-admin/info')
      .then((res) => {
        if (res.ok) return res.json();
        return [];
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setIsGroupAdmin(true);
        }
      })
      .catch(() => {});
  }, []);

  async function signOut() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <nav className="bg-white border-b px-4 py-3 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg text-indigo-600">Reality Bets</Link>
      <div className="flex items-center gap-4">
        {isGroupAdmin && (
          <Link href="/group-admin" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            My Group
          </Link>
        )}
        <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-800">Sign out</button>
      </div>
    </nav>
  );
}
