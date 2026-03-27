'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await createBrowserSupabase().auth.signOut();
    router.push('/admin/login');
  }

  const nav = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/shows', label: 'Shows' },
    { href: '/admin/users', label: 'Users' },
  ];

  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-indigo-700 text-white px-4 py-3 flex items-center gap-6">
        <span className="font-bold">Admin</span>
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`text-sm hover:text-indigo-200 ${pathname === n.href ? 'font-semibold underline' : ''}`}
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
