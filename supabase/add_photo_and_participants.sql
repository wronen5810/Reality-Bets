-- Add photo_url to participants
ALTER TABLE participants ADD COLUMN IF NOT EXISTS photo_url text;

-- Remove all existing participants for this show
DELETE FROM participants
WHERE show_id = (SELECT id FROM shows WHERE name = 'המירוץ למיליון 2026');

-- Insert המירוץ למיליון 2026 participants
INSERT INTO participants (show_id, name, photo_url)
SELECT s.id, p.name, p.photo_url
FROM shows s
CROSS JOIN (VALUES
  ('שלומי יפרח ואסף זגה',   'https://img.mako.co.il/2026/01/21/W_grid_asaf_shlomi132_autoOrient_w.jpg'),
  ('חן דריקס ויוסי עזרא',   'https://img.mako.co.il/2026/03/25/W_grid_YOSSIVCHEN(1)_autoOrient_w.jpg'),
  ('מאי חטואל ואיתי און',    NULL),
  ('ספיר הרוש וספיר צמח',   NULL),
  ('טום שלח ואלמוג אוחיון', NULL),
  ('גלי וראובן לביא',        NULL),
  ('רון הורוביץ ומיטב זיו',  NULL),
  ('עמרי ואיתי רוזנבליט',    NULL),
  ('נריה ואמונה זינגבוים',   NULL),
  ('נוני קרן ומיכל פרס',    'https://images.maariv.co.il/image/upload/f_auto,fl_lossy/c_fill,g_faces:center,h_410,w_728/1059191'),
  ('דני ואזי בוחבוט',        NULL),
  ('יותם אוחיון ונופר זומר', NULL),
  ('אור אוחנה ועדי עצמי',    NULL),
  ('תום וסמנטה',             NULL)
) AS p(name, photo_url)
WHERE s.name = 'המירוץ למיליון 2026'
ON CONFLICT (show_id, name) DO UPDATE SET photo_url = EXCLUDED.photo_url;
