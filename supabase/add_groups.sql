-- groups table
CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- group_members: user_email references allowed_users(email) but NO FK (Supabase SQL editor substitution bug)
CREATE TABLE group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (group_id, user_email)
);

-- show_groups: links shows to groups
CREATE TABLE show_groups (
  show_id uuid REFERENCES shows(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (show_id, group_id)
);
