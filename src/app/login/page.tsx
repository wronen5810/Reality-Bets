'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { Suspense } from 'react';

function MemberIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* TV screen */}
      <rect x="30" y="40" width="140" height="90" rx="8" fill="#1E1B4B" />
      <rect x="38" y="48" width="124" height="74" rx="4" fill="#312E81" />
      {/* Screen glow */}
      <rect x="42" y="52" width="116" height="66" rx="3" fill="#4338CA" opacity="0.6" />
      {/* Stars on screen */}
      <polygon points="80,65 83,74 92,74 85,79 88,88 80,83 72,88 75,79 68,74 77,74" fill="#FCD34D" />
      <polygon points="110,60 112,67 119,67 113,71 115,78 110,74 105,78 107,71 101,67 108,67" fill="#FCD34D" opacity="0.8" />
      <polygon points="130,72 131,77 136,77 132,80 133,85 130,82 127,85 128,80 124,77 129,77" fill="#FCD34D" opacity="0.6" />
      {/* TV stand */}
      <rect x="90" y="130" width="20" height="14" rx="2" fill="#374151" />
      <rect x="75" y="142" width="50" height="6" rx="3" fill="#374151" />
      {/* Popcorn bucket */}
      <rect x="148" y="118" width="22" height="26" rx="3" fill="#EF4444" />
      <rect x="146" y="115" width="26" height="6" rx="2" fill="#DC2626" />
      {/* Popcorn pieces */}
      <circle cx="153" cy="110" r="4" fill="#FEF3C7" />
      <circle cx="160" cy="107" r="4" fill="#FEF3C7" />
      <circle cx="167" cy="110" r="4" fill="#FEF3C7" />
      <circle cx="156" cy="105" r="3" fill="#FEF3C7" />
      <circle cx="163" cy="103" r="3" fill="#FEF3C7" />
      {/* Red stripes on popcorn bucket */}
      <rect x="152" y="118" width="4" height="26" rx="1" fill="#DC2626" opacity="0.5" />
      <rect x="162" y="118" width="4" height="26" rx="1" fill="#DC2626" opacity="0.5" />
      {/* Person silhouette watching */}
      <circle cx="60" cy="148" r="10" fill="#6D28D9" />
      <rect x="50" y="158" width="20" height="22" rx="6" fill="#6D28D9" />
      {/* Eyes */}
      <circle cx="56" cy="147" r="2" fill="white" />
      <circle cx="64" cy="147" r="2" fill="white" />
      {/* Smile */}
      <path d="M56 152 Q60 156 64 152" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function GroupAdminIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Clipboard / dashboard */}
      <rect x="55" y="30" width="90" height="110" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="2" />
      <rect x="80" y="24" width="40" height="14" rx="4" fill="#6D28D9" />
      {/* Bar chart bars */}
      <rect x="68" y="90" width="14" height="35" rx="2" fill="#A78BFA" />
      <rect x="88" y="75" width="14" height="50" rx="2" fill="#7C3AED" />
      <rect x="108" y="82" width="14" height="43" rx="2" fill="#A78BFA" />
      <rect x="128" y="65" width="14" height="60" rx="2" fill="#6D28D9" />
      {/* Chart baseline */}
      <line x1="63" y1="128" x2="148" y2="128" stroke="#E5E7EB" strokeWidth="1.5" />
      {/* Title line */}
      <rect x="68" y="45" width="64" height="6" rx="3" fill="#E5E7EB" />
      <rect x="68" y="56" width="44" height="5" rx="2.5" fill="#F3F4F6" />
      {/* Crown above clipboard */}
      <polygon points="100,8 107,18 115,13 110,22 90,22 85,13 93,18" fill="#FCD34D" />
      {/* People icons below */}
      <circle cx="62" cy="162" r="9" fill="#7C3AED" />
      <rect x="54" y="171" width="16" height="16" rx="5" fill="#7C3AED" />
      <circle cx="100" cy="158" r="11" fill="#6D28D9" />
      <rect x="89" y="169" width="22" height="18" rx="6" fill="#6D28D9" />
      <circle cx="138" cy="162" r="9" fill="#7C3AED" />
      <rect x="130" y="171" width="16" height="16" rx="5" fill="#7C3AED" />
      {/* Connection lines */}
      <line x1="70" y1="165" x2="89" y2="165" stroke="#C4B5FD" strokeWidth="1.5" />
      <line x1="111" y1="165" x2="130" y2="165" stroke="#C4B5FD" strokeWidth="1.5" />
      {/* Checkmark badge on center person */}
      <circle cx="110" cy="150" r="8" fill="#10B981" />
      <path d="M106 150 L109 153 L114 147" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function LoginForm({ type }: { type: 'member' | 'group-admin' }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/instant-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? 'Login failed');
      setLoading(false);
      return;
    }

    const { access_token, refresh_token } = await res.json();
    const supabase = createBrowserSupabase();
    await supabase.auth.setSession({ access_token, refresh_token });
    router.push(type === 'group-admin' ? '/group-admin' : '/');
    router.refresh();
  }

  return (
    <div className="mt-5 border-t border-gray-100 pt-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

function LandingInner() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') as 'member' | 'group-admin' | null;
  const [selected, setSelected] = useState<'member' | 'group-admin' | null>(initialType);

  const cards = [
    {
      type: 'member' as const,
      title: 'Member',
      description: 'Watch shows, place bets, and compete on the leaderboard.',
      illustration: <MemberIllustration />,
      border: 'hover:border-indigo-400',
      activeBorder: 'border-indigo-500 ring-2 ring-indigo-200',
    },
    {
      type: 'group-admin' as const,
      title: 'Group Admin',
      description: 'Manage your group, members, and participants.',
      illustration: <GroupAdminIllustration />,
      border: 'hover:border-purple-400',
      activeBorder: 'border-purple-500 ring-2 ring-purple-200',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Reality Bets</h1>
        <p className="text-gray-500">How are you signing in today?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-xl">
        {cards.map((card) => {
          const isSelected = selected === card.type;
          return (
            <div
              key={card.type}
              onClick={() => setSelected(isSelected ? null : card.type)}
              className={`bg-white rounded-2xl shadow-md cursor-pointer border-2 transition-all duration-200 p-6 flex flex-col items-center text-center
                ${isSelected ? card.activeBorder : `border-transparent ${card.border} hover:shadow-lg`}`}
            >
              <div className="w-36 h-36 mb-4">
                {card.illustration}
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{card.title}</h2>
              <p className="text-sm text-gray-500">{card.description}</p>
              {isSelected && <LoginForm type={card.type} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>}>
      <LandingInner />
    </Suspense>
  );
}
