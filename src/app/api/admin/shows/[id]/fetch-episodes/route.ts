import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

// Known episode schedules indexed by show name (Hebrew)
const KNOWN_EPISODES: Record<string, { episode_number: number; air_datetime: string }[]> = {
  'האח הגדול': [
    { episode_number: 1,  air_datetime: '2026-01-21T19:00:00Z' },
    { episode_number: 2,  air_datetime: '2026-01-28T19:00:00Z' },
    { episode_number: 3,  air_datetime: '2026-02-04T19:00:00Z' },
    { episode_number: 4,  air_datetime: '2026-02-11T19:00:00Z' },
    { episode_number: 5,  air_datetime: '2026-02-18T19:00:00Z' },
    { episode_number: 6,  air_datetime: '2026-02-25T19:00:00Z' },
    { episode_number: 7,  air_datetime: '2026-03-04T19:00:00Z' },
    { episode_number: 8,  air_datetime: '2026-03-11T19:00:00Z' },
    { episode_number: 9,  air_datetime: '2026-03-18T19:00:00Z' },
    { episode_number: 10, air_datetime: '2026-03-25T19:00:00Z' },
    { episode_number: 11, air_datetime: '2026-04-01T18:00:00Z' },
    { episode_number: 12, air_datetime: '2026-04-08T18:00:00Z' },
    { episode_number: 13, air_datetime: '2026-04-15T18:00:00Z' },
    { episode_number: 14, air_datetime: '2026-04-22T18:00:00Z' },
  ],
};

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { showName } = await request.json();

  const key = Object.keys(KNOWN_EPISODES).find(
    (k) => k === showName || k.toLowerCase().includes(showName.toLowerCase()) || showName.toLowerCase().includes(k.toLowerCase())
  );
  const episodes = key ? KNOWN_EPISODES[key] : null;

  if (!episodes) {
    return NextResponse.json({ error: `No episode data found for "${showName}"` }, { status: 404 });
  }

  return NextResponse.json(episodes);
}
