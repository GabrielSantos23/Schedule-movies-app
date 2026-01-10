"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupSchedule } from "./types";
import { MovieCard } from "./movie-card";
import type { User } from "@supabase/supabase-js";

export function MovieRow({
  title,
  icon: Icon,
  schedules,
  user,
  onVote,
  onEdit,
  onDelete,
  processingStates,
}: {
  title: string;
  icon: React.ElementType;
  schedules: GroupSchedule[];
  user: User;
  onVote: (schedule: GroupSchedule) => void;
  onEdit: (schedule: GroupSchedule) => void;
  onDelete: (schedule: GroupSchedule) => void;
  processingStates: Record<string, "vote" | "delete">;
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
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
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
        {schedules.map((schedule) => (
          <MovieCard
            key={schedule.id}
            schedule={schedule}
            user={user}
            onVote={() => onVote(schedule)}
            onEdit={() => onEdit(schedule)}
            onDelete={() => onDelete(schedule)}
            isProcessing={!!processingStates[schedule.id]}
            processingType={processingStates[schedule.id]}
          />
        ))}
      </div>
    </div>
  );
}
