import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

// Known participant data indexed by show name (Hebrew)
const KNOWN_SHOWS: Record<string, { name: string; photo_url: string | null }[]> = {
  'המירוץ למיליון 2026': [
    { name: 'שלומי יפרח ואסף זגה',   photo_url: 'https://img.mako.co.il/2026/01/21/W_grid_asaf_shlomi132_autoOrient_w.jpg' },
    { name: 'חן דריקס ויוסי עזרא',   photo_url: 'https://img.mako.co.il/2026/03/25/W_grid_YOSSIVCHEN(1)_autoOrient_w.jpg' },
    { name: 'מאי חטואל ואיתי און',    photo_url: null },
    { name: 'ספיר הרוש וספיר צמח',   photo_url: null },
    { name: 'טום שלח ואלמוג אוחיון', photo_url: null },
    { name: 'גלי וראובן לביא',        photo_url: null },
    { name: 'רון הורוביץ ומיטב זיו',  photo_url: null },
    { name: 'עמרי ואיתי רוזנבליט',    photo_url: null },
    { name: 'נריה ואמונה זינגבוים',   photo_url: null },
    { name: 'נוני קרן ומיכל פרס',    photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_410,w_728/1059191' },
    { name: 'דני ואזי בוחבוט',        photo_url: null },
    { name: 'יותם אוחיון ונופר זומר', photo_url: null },
    { name: 'אור אוחנה ועדי עצמי',    photo_url: null },
    { name: 'תום וסמנטה',             photo_url: null },
  ],
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { showName } = await request.json();
  const participants = KNOWN_SHOWS[showName] ?? null;

  if (!participants) {
    return NextResponse.json({ error: 'No participant data found for this show' }, { status: 404 });
  }

  return NextResponse.json(participants);
}
