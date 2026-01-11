"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExploreCard } from "./explore-card";
import { Link } from "next-view-transitions";
import { MediaItem } from "./types";
import { cn } from "@/lib/utils"; // Utilitário padrão do Shadcn para classes

interface ExploreRowProps {
  title: string;
  items: MediaItem[];
  type: "movie" | "tv";
  variant?: "row" | "grid"; // Nova prop
}

export function ExploreRow({
  title,
  items,
  type,
  variant = "row",
}: ExploreRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const isGrid = variant === "grid";

  const checkScroll = () => {
    if (scrollRef.current && !isGrid) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    if (isGrid) return;

    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [items, isGrid]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -600 : 600;
      scrollRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div
      className={cn(
        "space-y-4 py-4 mx-auto",
        isGrid ? "max-w-7xl px-4 md:px-8" : "max-w-[93vw]"
      )}
    >
      <div className="flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <h2
            className={cn(
              "font-bold",
              isGrid ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
            )}
          >
            {title}
          </h2>
          {/* Só mostra o link "Explore All" se não estivermos já na visão de grid */}
          {!isGrid && (
            <Link
              href={`/explore/all?type=${type}`}
              className="text-xs font-medium text-primary hover:underline mt-1"
            >
              Explore All
            </Link>
          )}
        </div>

        {/* Controles de scroll: Ocultos se for grid */}
        {!isGrid && (
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {isGrid ? (
        // Renderização em GRID (Para a página Explore All)
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {items.map((item) => (
            <ExploreCard key={item.id} item={item} type={type} />
          ))}
        </div>
      ) : (
        // Renderização em ROW (Carrossel original)
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto px-4 md:px-8 pb-4 scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex gap-4">
            {items.map((item) => (
              <ExploreCard key={item.id} item={item} type={type} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
