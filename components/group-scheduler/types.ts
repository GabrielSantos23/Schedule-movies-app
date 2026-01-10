export interface Movie {
  id: number;
  title?: string;
  name?: string; // For TV series
  overview: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string; // For TV series
  vote_average: number;
  media_type?: "movie" | "tv";
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
  media_type?: "movie" | "tv";
  // watched/rating removed as per user latest manual edits state check
  // But wait, in step 192 (latest view), the user had:
  /*
  interface GroupSchedule {
    id: string;
    movie_id: number;
    movie_title: string;
    movie_poster: string | null;
    movie_overview: string | null;
    scheduled_date: string | null;
    user_id: string;
    user_email?: string;
    schedule_votes?: { user_id: string }[];
    media_type?: "movie" | "tv";
    watched?: boolean;
    rating?: number | null; // User rating
    vote_average?: number; // TMDB rating
  }
  */
  // ERROR: In step 183 the user REMOVED watched, rating, vote_average.
  /*
  @@ -78,9 +78,6 @@
     user_email?: string;
     schedule_votes?: { user_id: string }[];
     media_type?: "movie" | "tv";
  -  watched?: boolean;
  -  rating?: number | null; // User rating
  -  vote_average?: number; // TMDB rating
   }
  */
  // So I must NOT include them.
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
  profiles?: { email: string };
}

// Helper to parse date strings without timezone issues
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}
