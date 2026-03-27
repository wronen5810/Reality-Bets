-- ============================================================
-- Reality Bets — Supabase Schema
-- ============================================================

create table if not exists shows (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists participants (
  id         uuid        primary key default gen_random_uuid(),
  show_id    uuid        not null references shows(id) on delete cascade,
  name       text        not null,
  is_active  boolean     not null default true,
  created_at timestamptz not null default now(),
  unique (show_id, name)
);

create table if not exists episodes (
  id                          uuid        primary key default gen_random_uuid(),
  show_id                     uuid        not null references shows(id) on delete cascade,
  episode_number              int         not null,
  title                       text,
  air_datetime                timestamptz not null,
  status                      text        not null default 'upcoming'
                                check (status in ('upcoming', 'resolved')),
  eliminated_participant_id   uuid        references participants(id),
  winner_participant_id       uuid        references participants(id),
  created_at                  timestamptz not null default now(),
  unique (show_id, episode_number)
);

create table if not exists allowed_users (
  id           uuid        primary key default gen_random_uuid(),
  email        text        not null unique,
  display_name text        not null,
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists bets (
  id                        uuid        primary key default gen_random_uuid(),
  user_email                text        not null,
  episode_id                uuid        not null references episodes(id) on delete cascade,
  eliminated_participant_id uuid        not null references participants(id),
  winner_participant_id     uuid        not null references participants(id),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (user_email, episode_id)
);

create table if not exists points (
  id         uuid        primary key default gen_random_uuid(),
  user_email text        not null,
  episode_id uuid        not null references episodes(id) on delete cascade,
  show_id    uuid        not null references shows(id) on delete cascade,
  points     int         not null check (points between 0 and 2),
  created_at timestamptz not null default now(),
  unique (user_email, episode_id)
);

-- RLS (all access via service role key in API routes)
alter table shows          enable row level security;
alter table participants    enable row level security;
alter table episodes        enable row level security;
alter table allowed_users   enable row level security;
alter table bets            enable row level security;
alter table points          enable row level security;
