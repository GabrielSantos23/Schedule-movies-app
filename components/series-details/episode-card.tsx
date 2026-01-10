"use client";

import { Play, ThumbsUp, Tv } from "lucide-react";
import { Episode, ViewMode } from "./types";

export function EpisodeCard({
  episode,
  viewMode,
}: {
  episode: Episode;
  viewMode: ViewMode;
}) {
  const formatVotes = (votes: number) => {
    if (votes >= 1000) {
      return `${(votes / 1000).toFixed(1)}K`;
    }
    return votes.toString();
  };

  if (viewMode === "compact") {
    return (
      <div className="group relative rounded-xl overflow-hidden bg-muted aspect-video cursor-pointer">
        {episode.still_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
            alt={episode.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Tv className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center">
            <Play className="h-5 w-5 text-foreground fill-foreground ml-0.5" />
          </div>
        </div>

        {/* Episode number */}
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-muted-foreground text-xs font-medium">
            E{episode.episode_number}
          </p>
        </div>

        {/* Vote count badge */}
        {episode.vote_count > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 text-muted-foreground text-xs">
            <ThumbsUp className="h-3 w-3" />
            <span>{formatVotes(episode.vote_count)}</span>
          </div>
        )}
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="group flex gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
        {/* Thumbnail */}
        <div className="relative flex-shrink-0 w-48 aspect-video rounded-lg overflow-hidden">
          {episode.still_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
              alt={episode.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Tv className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 py-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {episode.episode_number}. {episode.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {episode.overview || "No overview available."}
              </p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs font-medium whitespace-nowrap">
              <ThumbsUp className="h-3 w-3" />
              <span>{formatVotes(episode.vote_count)}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              {new Date(episode.air_date).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span>•</span>
            <span>{episode.runtime || 45} min</span>
          </div>
        </div>
      </div>
    );
  }

  // Grid View (Default)
  return (
    <div className="group space-y-3 cursor-pointer">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted shadow-sm transition-all group-hover:shadow-md group-hover:-translate-y-1">
        {episode.still_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
            alt={episode.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Tv className="h-10 w-10 text-muted-foreground/50" />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

        {/* Play Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-background/90 rounded-full p-3 shadow-xl backdrop-blur-sm transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="h-6 w-6 fill-current text-foreground ml-1" />
          </div>
        </div>

        {/* Episode Number Badge */}
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-white">
          EP {episode.episode_number}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {episode.name}
          </h3>
          {episode.vote_average > 0 && (
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              <span className="text-yellow-500">★</span>
              {episode.vote_average.toFixed(1)}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {episode.overview || "No overview available."}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground/70 pt-1">
          <span>
            {new Date(episode.air_date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
          <span>•</span>
          <span>{episode.runtime || "45"}m</span>
        </div>
      </div>
    </div>
  );
}
