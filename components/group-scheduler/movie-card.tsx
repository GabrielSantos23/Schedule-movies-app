"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Film, Trash2, Loader2, Pencil, Heart, Star, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";
import { GroupSchedule, parseLocalDate } from "./types";

export function MovieCard({
  schedule,
  user,
  onVote,
  onEdit,
  onDelete,
  isProcessing,
  processingType,
}: {
  schedule: GroupSchedule;
  user: User;
  onVote: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isProcessing: boolean;
  processingType?: "vote" | "delete";
}) {
  const router = useRouter();
  const hasVoted = schedule.schedule_votes?.some((v) => v.user_id === user.id);
  const voteCount = schedule.schedule_votes?.length || 0;
  const isSeries = schedule.media_type === "tv";

  const handleCardClick = () => {
    if (isSeries) {
      router.push(`/series/${schedule.movie_id}`);
    } else {
      router.push(`/movie/${schedule.movie_id}`);
    }
  };

  return (
    <div className="group flex-shrink-0 w-[160px] md:w-[180px]">
      <div
        onClick={handleCardClick}
        className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted/50 shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-primary/20 group-hover:-translate-y-2 cursor-pointer"
      >
        {schedule.movie_poster ? (
          <img
            src={`https://image.tmdb.org/t/p/w342${schedule.movie_poster}`}
            alt={schedule.movie_title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            {isSeries ? (
              <Tv className="h-12 w-12 text-muted-foreground/30" />
            ) : (
              <Film className="h-12 w-12 text-muted-foreground/30" />
            )}
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="flex-1 h-8 text-xs gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                disabled={isProcessing}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                disabled={isProcessing}
              >
                {processingType === "delete" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Vote button - always visible */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVote();
          }}
          disabled={isProcessing}
          className={`absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center transition-all ${
            hasVoted
              ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
              : "bg-black/50 text-white/70 hover:bg-red-500 hover:text-white"
          }`}
        >
          {processingType === "vote" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={`h-4 w-4 ${hasVoted ? "fill-current" : ""}`} />
          )}
        </button>

        {/* Scheduled date badge */}
        {schedule.scheduled_date && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-primary/90 text-primary-foreground text-xs font-medium backdrop-blur-sm">
            {format(parseLocalDate(schedule.scheduled_date), "MMM d")}
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
          <span className="font-medium">{voteCount}</span>
          <span>•</span>
          <span>{voteCount === 1 ? "1 vote" : `${voteCount} votes`}</span>
        </div>
        <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {schedule.movie_title}
        </h4>
      </div>
    </div>
  );
}
