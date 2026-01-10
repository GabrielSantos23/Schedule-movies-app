"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupSchedule } from "./types";
import { User } from "@supabase/supabase-js";
import { MovieCard } from "./movie-card";

export function MovieRow({
  title,
  schedules,
  user,
  onEdit,
  onDelete,
  onToggleWatched,
  processingStates,
}: {
  title: string;
  icon: any;
  schedules: GroupSchedule[];
  user: User;
  onEdit: (s: GroupSchedule) => void;
  onDelete: (s: GroupSchedule) => void;
  onToggleWatched: (s: GroupSchedule) => void;
  processingStates: Record<string, "vote" | "delete" | "watch">;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
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
  }, [schedules]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -400 : 400,
        behavior: "smooth",
      });
    }
  };

  if (schedules.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full border border-border/50 ${
              !canScrollLeft ? "opacity-30" : ""
            }`}
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full border border-border/50 ${
              !canScrollRight ? "opacity-30" : ""
            }`}
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {schedules.map((s) => (
          <MovieCard
            key={s.id}
            schedule={s}
            user={user}
            onEdit={() => onEdit(s)}
            onDelete={() => onDelete(s)}
            onToggleWatched={() => onToggleWatched(s)}
            isProcessing={!!processingStates[s.id]}
            processingType={processingStates[s.id]}
          />
        ))}
      </div>
    </div>
  );
}
