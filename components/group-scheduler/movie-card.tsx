"use client";

import { format } from "date-fns";
import {
  Film,
  Tv,
  Pencil,
  Trash2,
  Check,
  Star,
  Loader2,
  Heart,
  Users2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { GroupSchedule, parseLocalDate, Member } from "./types";
import { User } from "@supabase/supabase-js";
import { useTransitionRouter } from "next-view-transitions";
import { StarRating } from "../StarRating";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MovieCardProps {
  schedule: GroupSchedule;
  user: User;
  onEdit: () => void;
  onDelete: () => void;
  onToggleWatched: () => void;
  onToggleInterest: (currentlyInterested: boolean | null) => void;
  isProcessing: boolean;
  processingType?: "vote" | "delete" | "watch";
  totalMembers?: number;
  members?: Member[];
}

export function MovieCard({
  schedule,
  user,
  onEdit,
  onDelete,
  onToggleWatched,
  onToggleInterest,
  isProcessing,
  processingType,
  totalMembers = 0,
  members = [],
}: MovieCardProps) {
  const router = useTransitionRouter();
  const isSeries = schedule.media_type === "tv";
  const { theme, resolvedTheme } = useTheme();

  const handleCardClick = () => {
    router.push(`/${isSeries ? "series" : "movie"}/${schedule.movie_id}`);
  };

  const rating = schedule.vote_average || 0;
  const isDark = (theme || resolvedTheme) === "dark";

  const interests = schedule.schedule_interests || [];
  const interestedUsers = interests.filter((i) => i.vote_type === 1);
  const myInterest = interests.find((i) => i.user_id === user.id);
  const amIInterested = myInterest?.vote_type === 1;
  const interestCount = interestedUsers.length;

  const interestedUserNames = interestedUsers.map((i, index) => {
    if (i.user_id === user.id) return "You";
    const member = members.find((m) => m.user_id === i.user_id);
    if (member) {
      return (
        member.profiles?.full_name ||
        member.profiles?.email?.split("@")[0] ||
        `Member ${index + 1}`
      );
    }
    return `Member ${index + 1}`;
  });
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

        {!schedule.watched && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="absolute top-2 right-2 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleInterest(amIInterested);
                  }}
                >
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm shadow-sm transition-colors ${
                      amIInterested === true
                        ? "bg-pink-500/90 text-white"
                        : "bg-black/50 text-white/80 hover:bg-pink-500/70"
                    }`}
                  >
                    <Heart
                      className={`h-3 w-3 ${
                        amIInterested === true ? "fill-current" : ""
                      }`}
                    />
                    {interestCount > 0 && (
                      <span className="text-xs font-medium">
                        {interestCount}
                      </span>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px]">
                <div className="text-xs space-y-1">
                  <p className="font-medium">
                    {amIInterested === true
                      ? "Click to remove your interest"
                      : "Click to show interest"}
                  </p>
                  {interestCount > 0 && (
                    <div className="pt-1 border-t border-border/50">
                      <p className="text-muted-foreground mb-1">Interested:</p>
                      <p className="font-medium">
                        {interestedUserNames.slice(0, 5).join(", ")}
                        {interestedUserNames.length > 5 &&
                          ` +${interestedUserNames.length - 5} more`}
                      </p>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
                  schedule.release_date || schedule.first_air_date!,
                ).getFullYear()
              : "N/A"}
            )
          </span>
        </div>
      </div>
    </div>
  );
}
