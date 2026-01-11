"use client";

import { Link } from "next-view-transitions";
import { MediaItem } from "./types";
import { StarRating } from "../StarRating";
import { useTheme } from "next-themes";

interface ExploreCardProps {
  item: MediaItem;
  type: "movie" | "tv";
}

export function ExploreCard({ item, type }: ExploreCardProps) {
  const title = item.title || item.name;
  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : null;
  const rating = item.vote_average || 0;
  const { theme, resolvedTheme } = useTheme();
  const isDark = (theme || resolvedTheme) === "dark";
  return (
    <Link
      href={`/${type === "tv" ? "series" : "movie"}/${item.id}`}
      className="block group w-[160px] md:w-[200px] shrink-0"
    >
      <div className="relative aspect-2/3 rounded-lg overflow-hidden bg-muted transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl">
        {poster ? (
          <img
            src={poster}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs p-2 text-center">
            {title}
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="mt-2 space-y-1.5">
        <h3 className="text-sm font-medium leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {rating > 0 && (
          <div className="flex items-center gap-1">
            {/* Componente de 5 estrelas */}
            <StarRating
              rating={rating}
              size={10}
              color={isDark ? "#80ffff" : "#0080ff"}
            />

            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
