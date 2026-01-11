"use client";

import { format } from "date-fns";
import { Film, Tv, Pencil, Trash2, Check, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { GroupSchedule, parseLocalDate } from "./types";
import { User } from "@supabase/supabase-js";
import { useTransitionRouter } from "next-view-transitions";
import { StarRating } from "../StarRating";
import { useTheme } from "next-themes";

interface MovieCardProps {
  schedule: GroupSchedule;
  user: User;
  onEdit: () => void;
  onDelete: () => void;
  onToggleWatched: () => void;
  isProcessing: boolean;
  processingType?: "vote" | "delete" | "watch";
}

export function MovieCard({
  schedule,
  user,
  onEdit,
  onDelete,
  onToggleWatched,
  isProcessing,
  processingType,
}: MovieCardProps) {
  const router = useTransitionRouter();
  const isSeries = schedule.media_type === "tv";
  const { theme, resolvedTheme } = useTheme();

  const handleCardClick = () => {
    router.push(`/${isSeries ? "series" : "movie"}/${schedule.movie_id}`);
  };

  const rating = schedule.vote_average || 0;

  const isDark = (theme || resolvedTheme) === "dark";
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
                <Pencil className="h-3 w-3" /> Edit
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

        {!schedule.watched && (
          <div
            className="absolute top-2 left-2 flex gap-1 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {schedule.scheduled_date && (
              <div className="px-2 py-1 rounded-md bg-primary/90 text-primary-foreground text-xs font-medium backdrop-blur-sm shadow-sm">
                {format(parseLocalDate(schedule.scheduled_date), "MMM d")}
              </div>
            )}
            <Button
              size="icon"
              variant="secondary"
              className="h-6 w-6 rounded-full bg-black/50 hover:bg-green-500 hover:text-white backdrop-blur-sm border-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatched();
              }}
            >
              <Check className="h-3 w-3" />
            </Button>
          </div>
        )}

        {schedule.watched && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur rounded-full px-2 py-1 flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            <span className="text-white text-xs font-bold">
              {schedule.rating || "-"}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <StarRating
            rating={rating}
            size={10}
            color={isDark ? "#80ffff" : "#0080ff"}
          />
          <span className="font-medium">
            {schedule.vote_average ? schedule.vote_average.toFixed(1) : "N/A"}
          </span>
          <span className="text-muted-foreground/50">•</span>
          <span>TMDB</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {schedule.movie_title}
          </h4>
          <span className="text-xs text-muted-foreground">
            (
            {schedule.release_date || schedule.first_air_date
              ? new Date(
                  schedule.release_date || schedule.first_air_date!
                ).getFullYear()
              : "N/A"}
            )
          </span>
        </div>
      </div>
    </div>
  );
}
