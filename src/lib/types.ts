export interface Show {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Participant {
  id: string;
  show_id: string;
  name: string;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Episode {
  id: string;
  show_id: string;
  episode_number: number;
  title: string | null;
  air_datetime: string;
  status: 'upcoming' | 'resolved';
  eliminated_participant_id: string | null;
  winner_participant_id: string | null;
  created_at: string;
}

export interface AllowedUser {
  id: string;
  email: string;
  display_name: string;
  is_active: boolean;
  created_at: string;
}

export interface Bet {
  id: string;
  user_email: string;
  episode_id: string;
  eliminated_participant_id: string;
  winner_participant_id: string;
  created_at: string;
  updated_at: string;
}

export interface Points {
  id: string;
  user_email: string;
  episode_id: string;
  show_id: string;
  points: number;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_email: string;
  role: 'admin' | 'member';
  created_at: string;
}

export interface GroupWithCounts extends Group {
  member_count: number;
  show_count: number;
}

export interface GroupMemberWithDisplay extends GroupMember {
  display_name: string | null;
}

export interface GroupWithDetails extends Group {
  members: GroupMemberWithDisplay[];
  shows: Show[];
}

export interface LeaderboardEntry {
  user_email: string;
  display_name: string;
  total_points: number;
  episodes_bet: number;
}

export interface EpisodeWithDetails extends Episode {
  eliminated_participant?: Participant;
  winner_participant?: Participant;
  user_bet?: Bet;
  user_points?: number;
  is_locked: boolean; // computed: now() > air_datetime
}
