"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ExploreCard } from "@/components/explore/explore-card";
import { MediaItem } from "@/components/explore/types";
import { Loader2, ChevronLeft } from "lucide-react";
import { Link } from "next-view-transitions";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface SearchResult extends Omit<MediaItem, "media_type"> {
  media_type?: "movie" | "tv" | "person";
  profile_path?: string | null;
  known_for_department?: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const router = useRouter();

  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
        `/api/tmdb/search?query=${encodeURIComponent(q)}&type=multi`,
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
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="w-px h-4 bg-border/50 mx-2" />
        <div className="flex items-center gap-2 font-medium">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8 mr-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          Search Results: {query}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto w-full relative">
        <div className="p-4 sm:p-8 space-y-8">
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
    </>
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
