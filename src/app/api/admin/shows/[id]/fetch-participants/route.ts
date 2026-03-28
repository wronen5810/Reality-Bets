import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

// Known participant data indexed by show name (Hebrew)
const KNOWN_SHOWS: Record<string, { name: string; photo_url: string | null }[]> = {
  'האח הגדול': [
    { name: 'פאינה לזובסקי',    photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_450,w_450/1077439' },
    { name: 'אלירן דוד ביטון',  photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_450,w_450/1077441' },
    { name: 'שלי סרבריאניקוב',  photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_450,w_450/1077443' },
    { name: 'עומר ציפורי',      photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_450,w_450/1077447' },
    { name: 'מירה נואף',        photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_711,w_400/1077450' },
    { name: 'זוהר אייזיק זקן',  photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_450,w_450/1077453' },
    { name: 'פטל אסף',          photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_711,w_400/1077455' },
    { name: 'תמיר גולן',        photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_711,w_400/1077458' },
    { name: 'אור כהן',          photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_711,w_400/1077460' },
    { name: 'נדב ברנס',         photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_450,w_450/1077467' },
    { name: 'טל טיטו',          photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_711,w_400/1077469' },
    { name: 'הילי לאה בצלאל',   photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_711,w_400/1077471' },
    { name: 'נעם טקלה',         photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_711,w_400/1077473' },
    { name: 'גאיה קלדרון',      photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_711,w_400/1077484' },
    { name: 'הודיה כהן',        photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_450,w_450/1077684' },
    { name: 'קורן חתוכה',       photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_450,w_450/1077686' },
    { name: 'דניאל משה',        photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_711,w_400/1077696' },
    { name: 'הילה חיטכס',       photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_711,w_400/1077699' },
    { name: 'בן אוזלבו',        photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_711,w_400/1077704' },
    { name: 'גל רובין',         photo_url: 'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_400,w_711/1078517' },
  ],
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

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { showName } = await request.json();

  // Try exact match first, then case-insensitive partial match
  const key = Object.keys(KNOWN_SHOWS).find(
    (k) => k === showName || k.toLowerCase().includes(showName.toLowerCase()) || showName.toLowerCase().includes(k.toLowerCase())
  );
  const participants = key ? KNOWN_SHOWS[key] : null;

  if (!participants) {
    return NextResponse.json({ error: `No participant data found for "${showName}"` }, { status: 404 });
  }

  return NextResponse.json(participants);
}
