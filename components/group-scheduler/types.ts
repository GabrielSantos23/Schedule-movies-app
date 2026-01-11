import type { User } from "@supabase/supabase-js";

export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type?: "movie" | "tv";
}

export interface ScheduleInterest {
  id: string;
  schedule_id: string;
  user_id: string;
  interested: boolean;
  profiles?: { email: string; full_name?: string; avatar_url?: string };
}

export interface GroupSchedule {
  id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  movie_overview: string | null;
  scheduled_date: string | null;
  user_id: string;
  user_email?: string;
  schedule_votes?: { user_id: string }[];
  schedule_interests?: ScheduleInterest[];
  media_type?: "movie" | "tv";
  watched?: boolean;
  rating?: number | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
}

export interface Member {
  id: string;
  user_id: string;
  role: string;
  profiles?: { email: string; full_name?: string; avatar_url?: string };
}

export interface GroupActivity {
  id: string;
  group_id: string;
  user_id: string;
  action:
    | "added_movie"
    | "removed_movie"
    | "marked_watched"
    | "showed_interest"
    | "joined_group"
    | "scheduled_movie"
    | "updated_group"
    | "removed_date";
  movie_title?: string;
  created_at: string;
  profiles?: { email: string; full_name?: string; avatar_url?: string };
}

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}
