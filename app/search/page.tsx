"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ExploreCard } from "@/components/explore/explore-card";
import { MediaItem } from "@/components/explore/types";
import { Loader2 } from "lucide-react";
import GroupsSidebar from "@/components/groups-sidebar";
import { createClient } from "@/lib/client";
import { User } from "@supabase/supabase-js";
import { SearchOverlay } from "@/components/search-overlay";
import { Link } from "next-view-transitions";

interface SearchResult extends Omit<MediaItem, "media_type"> {
  media_type?: "movie" | "tv" | "person";
  profile_path?: string | null;
  known_for_department?: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Fetch User for Sidebar
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  // Perform search when URL param changes
  useEffect(() => {
    if (query) {
      search(query);
    } else {
      setResults([]);
    }
  }, [query]);

  const search = async (q: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/tmdb/search?query=${encodeURIComponent(q)}&type=multi`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const movies = results.filter((i) => i.media_type === "movie");
  const tvShows = results.filter((i) => i.media_type === "tv");
  const people = results.filter((i) => i.media_type === "person");

  const gridClassName =
    "grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-x-4 gap-y-10";

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {user && (
        <GroupsSidebar
          user={user}
          initialSearchOpen={true}
          initialSearchQuery={query}
        />
      )}

      {/* Removido o mx-auto da div interna para o grid expandir. 
          Adicionado md:ml-20 caso sua sidebar seja fixa/absoluta para não cobrir o conteúdo.
      */}
      <div className="flex-1 overflow-y-auto w-full relative md:ml-20">
        <div className="pt-24 pb-12 px-4 sm:px-8 space-y-8">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : !query ? (
            <div className="text-center py-20 text-muted-foreground text-lg">
              Type something to start searching...
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground text-lg">
              No results found for "{query}".
            </div>
          ) : (
            <div className="space-y-12">
              {/* Movies Section */}
              {movies.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    Movies
                    <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {movies.length}
                    </span>
                  </h2>
                  <div className={gridClassName}>
                    {movies.map((item) => (
                      <ExploreCard
                        key={item.id}
                        item={item as MediaItem}
                        type="movie"
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* TV Shows Section */}
              {tvShows.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    TV Shows
                    <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {tvShows.length}
                    </span>
                  </h2>
                  <div className={gridClassName}>
                    {tvShows.map((item) => (
                      <ExploreCard
                        key={item.id}
                        item={item as MediaItem}
                        type="tv"
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* People Section */}
              {people.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    People
                    <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {people.length}
                    </span>
                  </h2>
                  <div className={gridClassName}>
                    {people.map((person) => (
                      <Link
                        key={person.id}
                        href={`/person/${person.id}`}
                        className="group relative bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all w-full"
                      >
                        <div className="aspect-2/3 bg-muted relative overflow-hidden">
                          {person.profile_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w500${person.profile_path}`}
                              alt={person.name}
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/50">
                              <div className="bg-muted h-10 w-10 rounded-full" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-sm truncate">
                            {person.name}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {person.known_for_department}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-20 min-h-screen">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
