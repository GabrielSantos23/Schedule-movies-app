"use client";

import { Star, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { MediaItem } from "./types";
import { useTransitionRouter } from "next-view-transitions";

interface HeroProps {
  item: MediaItem;
}

export function ExploreHero({ item }: HeroProps) {
  const router = useTransitionRouter();

  if (!item) return null;

  const title = item.title || item.name || "";
  const description = item.overview;
  const rating = item.vote_average?.toFixed(1);
  const year = (item.release_date || item.first_air_date || "").split("-")[0];
  const backdrop = item.backdrop_path
    ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
    : null;

  const handleNavigate = () => {
    const type = item.media_type === "tv" ? "series" : "movie";
    router.push(`/${type}/${item.id}`);
  };

  return (
    <div className="relative w-full h-[60vh] min-h-[500px]">
      {backdrop && (
        <div className="absolute inset-0">
          <img
            src={backdrop}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-r from-background via-background/60 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="absolute bottom-30 left-0 p-8 ml-10 md:p-16 max-w-3xl space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-md">
          {title}
        </h1>

        <div className="flex items-center gap-4 text-sm md:text-base font-medium text-white/90">
          {rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span>{rating} Reviews</span>
            </div>
          )}
          {year && <span>{year}</span>}
        </div>

        <p className="text-lg text-white/80 line-clamp-3 md:line-clamp-4 max-w-2xl drop-shadow-sm">
          {description}
        </p>

        <div className="pt-4">
          <Button onClick={handleNavigate} size="lg" className="w-fit gap-2">
            <Play className="h-4 w-4 fill-current" /> Watch Trailer
          </Button>
        </div>
      </div>
    </div>
  );
}
