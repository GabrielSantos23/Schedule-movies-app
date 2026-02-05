"use client";

import { useEffect, useState } from "react";
import { ExploreHero } from "@/components/explore/explore-hero";
import { ExploreRow } from "@/components/explore/explore-row";
import { Loader2 } from "lucide-react";
import { MediaItem } from "@/components/explore/types";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function ExplorePage() {
  const [data, setData] = useState<{
    movies: MediaItem[];
    tv: MediaItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

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
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="w-px h-4 bg-border/50 mx-2" />
        <div className="flex items-center gap-2 font-medium">Explore</div>
      </header>
      <div className="flex-1 overflow-y-auto">
        {heroItem && <ExploreHero item={heroItem} />}

        <div className="space-y-6 pb-20 -mt-20 relative z-10 p-4">
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
    </>
  );
}
