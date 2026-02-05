"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ExploreCard } from "@/components/explore/explore-card";
import { Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaItem } from "@/components/explore/types";
import { useTransitionRouter } from "next-view-transitions";
import { SidebarTrigger } from "@/components/ui/sidebar";

function ExploreAllContent() {
  const searchParams = useSearchParams();
  const router = useTransitionRouter();
  const type = (searchParams.get("type") as "movie" | "tv") || "movie";

  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  // Reset when type changes
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
  }, [type]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/tmdb/trending/paginated?type=${type}&page=${page}`,
        );
        if (res.ok) {
          const data = await res.json();
          const newItems = data.results || [];

          setItems((prev) => {
            // Basic deduplication just in case
            const existingIds = new Set(prev.map((i) => i.id));
            const uniqueNewItems = newItems.filter(
              (i: MediaItem) => !existingIds.has(i.id),
            );
            return [...prev, ...uniqueNewItems];
          });

          setHasMore(page < (data.total_pages || 1));
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, page]);

  const title = type === "tv" ? "Trending TV Shows" : "Trending Movies";

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
          {title}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="w-full mx-auto space-y-6">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-x-4 gap-y-10 w-full">
            {items.map((item, index) => {
              if (items.length === index + 1) {
                return (
                  <div ref={lastElementRef} key={`${item.id}-${index}`}>
                    <ExploreCard item={item} type={type} />
                  </div>
                );
              }
              return (
                <ExploreCard
                  key={`${item.id}-${index}`}
                  item={item}
                  type={type}
                />
              );
            })}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!loading && !hasMore && (
            <div className="text-center py-8 text-muted-foreground">
              You've reached the end!
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function ExploreAllPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ExploreAllContent />
    </Suspense>
  );
}
