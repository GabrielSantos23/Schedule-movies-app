"use client";

import { useEffect, useState } from "react";
import { ExploreHero } from "@/components/explore/explore-hero";
import { ExploreRow } from "@/components/explore/explore-row";
import { Loader2 } from "lucide-react";
import GroupsSidebar from "@/components/groups-sidebar";
import { createClient } from "@/lib/client";
import { MediaItem } from "@/components/explore/types";
import { User } from "@supabase/supabase-js";

export default function ExplorePage() {
  const [data, setData] = useState<{
    movies: MediaItem[];
    tv: MediaItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null); // To manage current user for Sidebar

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/tmdb/trending");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch trending data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const heroItem =
    data?.movies?.[
      Math.floor(Math.random() * Math.min(5, data.movies.length || 1))
    ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {user && <GroupsSidebar user={user} />}

      <div className="flex-1 overflow-y-auto">
        {heroItem && <ExploreHero item={heroItem} />}

        <div className="space-y-6 pb-20 -mt-20 relative z-10">
          {data?.movies && (
            <ExploreRow
              title="Trending Movies"
              items={data.movies}
              type="movie"
            />
          )}

          {data?.tv && (
            <ExploreRow title="Trending TV Shows" items={data.tv} type="tv" />
          )}
        </div>
      </div>
    </div>
  );
}
