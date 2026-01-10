"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Play,
  Star,
  Clock,
  Calendar,
  Tv,
  Users,
  Grid3X3,
  List,
  LayoutGrid,
  LoaderCircle,
} from "lucide-react";
import { SeriesDetails, Season, ViewMode } from "./types";
import { EpisodeCard } from "./episode-card";

export default function SeriesDetailsClient({
  seriesId,
}: {
  seriesId: string;
}) {
  const [series, setSeries] = useState<SeriesDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [loadingSeasonChange, setLoadingSeasonChange] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/tmdb/tv/${seriesId}?season=${selectedSeason}`
        );
        if (!response.ok) throw new Error("Failed to fetch series");
        const data = await response.json();
        setSeries(data);

        // Set initial season to first non-special season
        if (data.seasons && data.seasons.length > 0 && selectedSeason === 1) {
          const firstRealSeason = data.seasons.find(
            (s: Season) => s.season_number > 0
          );
          if (firstRealSeason && firstRealSeason.season_number !== 1) {
            setSelectedSeason(firstRealSeason.season_number);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load series");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSeries();
  }, [seriesId]);

  // Fetch new season when selected
  const handleSeasonChange = async (seasonNumber: string) => {
    const newSeason = parseInt(seasonNumber, 10);
    setSelectedSeason(newSeason);
    setLoadingSeasonChange(true);

    try {
      const response = await fetch(
        `/api/tmdb/tv/${seriesId}?season=${newSeason}`
      );
      if (response.ok) {
        const data = await response.json();
        setSeries((prev) =>
          prev ? { ...prev, currentSeason: data.currentSeason } : null
        );
      }
    } catch (err) {
      console.error("Failed to load season:", err);
    } finally {
      setLoadingSeasonChange(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoaderCircle className="h-16 w-16 mx-auto animate-spin" />
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Tv className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Series not found</h1>
          <p className="text-muted-foreground">
            {error || "Unable to load series details"}
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const creators = series.created_by || [];
  const averageRuntime =
    series.episode_run_time.length > 0
      ? Math.round(
          series.episode_run_time.reduce((a, b) => a + b, 0) /
            series.episode_run_time.length
        )
      : null;

  // Filter out specials (season 0) for the selector
  const availableSeasons = series.seasons.filter((s) => s.season_number > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Trailer Modal */}
      {showTrailer && series.trailer && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowTrailer(false)}
        >
          <div className="relative w-full max-w-5xl aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${series.trailer.key}?autoplay=1`}
              title={series.trailer.name}
              className="w-full h-full rounded-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <button
            className="absolute top-4 right-4 text-foreground hover:text-primary transition-colors"
            onClick={() => setShowTrailer(false)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Section with Backdrop */}
      <div className="relative min-h-[80vh]">
        {/* Backdrop Image */}
        <div className="absolute inset-0">
          {series.backdrop_path ? (
            <img
              src={`https://image.tmdb.org/t/p/original${series.backdrop_path}`}
              alt={series.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted" />
          )}
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        </div>

        {/* Navigation */}
        <div className="relative z-10 container mx-auto px-4 pt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-muted-foreground/80 hover:text-muted-foreground hover:bg-muted/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="relative z-10 container mx-auto px-4 pt-12 ">
          <div className="grid lg:grid-cols-[1fr,1.5fr] gap-8 items-end">
            {/* Left: Series Info */}
            <div className="space-y-6 max-w-xl">
              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  {series.name}
                </h1>
                {series.tagline && (
                  <p className="text-lg text-muted-foreground/60 italic">
                    "{series.tagline}"
                  </p>
                )}
              </div>

              {/* Overview */}
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed line-clamp-4">
                {series.overview}
              </p>

              {/* Cast Avatars */}
              {series.credits.cast.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {series.credits.cast.slice(0, 5).map((actor) => (
                      <div
                        key={actor.id}
                        className="h-12 w-12 rounded-full border-2 border-background overflow-hidden bg-muted"
                        title={actor.name}
                      >
                        {actor.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                            alt={actor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Users className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    ))}
                    {series.credits.cast.length > 5 && (
                      <div className="h-12 w-12 rounded-full border-2 border-background bg-muted/80 flex items-center justify-center text-sm font-medium text-white">
                        +{series.credits.cast.length - 5}
                      </div>
                    )}
                  </div>
                  <div className="text-muted-foreground/60 text-sm">
                    {series.credits.cast
                      .slice(0, 3)
                      .map((a) => a.name.split(" ")[0])
                      .join(", ")}
                    {series.credits.cast.length > 3 && " & More"}
                  </div>
                </div>
              )}

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 relative">
                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-5 w-5 fill-current" />
                  </div>
                  <span className="text-2xl font-bold text-foreground">
                    {series.vote_average.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground/50">/10</span>
                </div>

                {/* Runtime */}
                {averageRuntime && (
                  <div className="flex items-center gap-2 text-muted-foreground/70">
                    <Clock className="h-4 w-4" />
                    <span>{averageRuntime}m per ep</span>
                  </div>
                )}

                {/* Year */}
                {series.first_air_date && (
                  <div className="flex items-center gap-2 text-muted-foreground/70">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(series.first_air_date).getFullYear()}</span>
                  </div>
                )}

                {/* Seasons */}
                <div className="flex items-center gap-2 text-muted-foreground/70">
                  <Tv className="h-4 w-4" />
                  <span>{series.number_of_seasons} Seasons</span>
                </div>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2">
                {series.genres.map((genre) => (
                  <Badge
                    key={genre.id}
                    variant="outline"
                    className="border-muted-foreground/30 text-muted-foreground bg-muted/10 hover:bg-muted/20"
                  >
                    {genre.name}
                  </Badge>
                ))}
              </div>

              {/* Streaming Providers */}
              <div className="pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Available on
                </h3>
                {series.providers ? (
                  <div className="flex flex-wrap gap-4">
                    {(() => {
                      // Adjust based on the corrected interface (no .results)
                      const country =
                        (series.providers as any).BR ||
                        (series.providers as any).US;
                      const flatrate = country?.flatrate || [];

                      if (flatrate.length === 0) {
                        return (
                          <span className="text-sm text-muted-foreground">
                            Not available for streaming
                          </span>
                        );
                      }

                      return flatrate.map((provider: any) => (
                        <div
                          key={provider.provider_name}
                          className="flex flex-col items-center gap-2"
                          title={provider.provider_name}
                        >
                          <div className="h-10 w-10 rounded-lg overflow-hidden bg-white shadow-sm">
                            <img
                              src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                              alt={provider.provider_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No streaming information available
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2  bottom-4">
                {series.trailer && (
                  <Button
                    size="lg"
                    className="gap-2 bg-background text-foreground hover:bg-background/90"
                    onClick={() => setShowTrailer(true)}
                  >
                    <Play className="h-5 w-5 fill-current" />
                    Watch Trailer
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      <div className="container mx-auto px-4 py-8">
        <section className="space-y-6">
          {/* Episodes Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold italic">Episodes</h2>

              {/* Season Selector */}
              <Select
                value={selectedSeason.toString()}
                onValueChange={handleSeasonChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Season" />
                </SelectTrigger>
                <SelectContent>
                  {availableSeasons.map((season) => (
                    <SelectItem
                      key={season.id}
                      value={season.season_number.toString()}
                    >
                      Season {season.season_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8 p-0"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "compact" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("compact")}
                className="h-8 w-8 p-0"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Episodes List */}
          {loadingSeasonChange ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : series.currentSeason?.episodes ? (
            <>
              {/* Grid View */}
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {series.currentSeason.episodes.map((episode) => (
                    <EpisodeCard
                      key={episode.id}
                      episode={episode}
                      viewMode="grid"
                    />
                  ))}
                </div>
              )}

              {/* List View */}
              {viewMode === "list" && (
                <div className="flex flex-col gap-4">
                  {series.currentSeason.episodes.map((episode) => (
                    <EpisodeCard
                      key={episode.id}
                      episode={episode}
                      viewMode="list"
                    />
                  ))}
                </div>
              )}

              {/* Compact View */}
              {viewMode === "compact" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {series.currentSeason.episodes.map((episode) => (
                    <EpisodeCard
                      key={episode.id}
                      episode={episode}
                      viewMode="compact"
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Tv className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No episodes available for this season</p>
            </div>
          )}
        </section>

        {/* Cast Section */}
        {series.credits.cast.length > 0 && (
          <section className="space-y-6 mt-12">
            <h2 className="text-2xl font-bold">Cast</h2>
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {series.credits.cast.map((actor) => (
                  <div
                    key={actor.id}
                    className="flex-shrink-0 w-32 text-center group"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                      {actor.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                          alt={actor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Users className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-sm line-clamp-1">
                      {actor.name}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {actor.character}
                    </p>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>
        )}

        {/* Info Cards */}
        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {creators.length > 0 && (
            <div className="space-y-2 p-4 rounded-xl bg-muted/50">
              <h3 className="text-sm text-muted-foreground font-medium">
                Created By
              </h3>
              <p className="font-semibold">
                {creators.map((c) => c.name).join(", ")}
              </p>
            </div>
          )}

          <div className="space-y-2 p-4 rounded-xl bg-muted/50">
            <h3 className="text-sm text-muted-foreground font-medium">
              Status
            </h3>
            <p className="font-semibold">{series.status}</p>
          </div>

          <div className="space-y-2 p-4 rounded-xl bg-muted/50">
            <h3 className="text-sm text-muted-foreground font-medium">
              Total Episodes
            </h3>
            <p className="font-semibold">{series.number_of_episodes}</p>
          </div>

          <div className="space-y-2 p-4 rounded-xl bg-muted/50">
            <h3 className="text-sm text-muted-foreground font-medium">Votes</h3>
            <p className="font-semibold">
              {series.vote_count.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-xl bg-muted/50">
            <h3 className="text-sm text-muted-foreground font-medium">
              First Aired
            </h3>
            <p className="font-semibold">
              {new Date(series.first_air_date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          {series.last_air_date && (
            <div className="space-y-2 p-4 rounded-xl bg-muted/50">
              <h3 className="text-sm text-muted-foreground font-medium">
                Last Aired
              </h3>
              <p className="font-semibold">
                {new Date(series.last_air_date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </section>

        {/* Similar Shows */}
        {series.similar.length > 0 && (
          <section className="space-y-6 mt-10">
            <h2 className="text-2xl font-bold">Similar Shows</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {series.similar.map((similar) => (
                <Link
                  key={similar.id}
                  href={`/series/${similar.id}`}
                  className="group"
                >
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted shadow-lg group-hover:shadow-xl transition-all group-hover:-translate-y-1">
                    {similar.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w342${similar.poster_path}`}
                        alt={similar.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Tv className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span>{similar.vote_average.toFixed(1)}</span>
                    </div>
                    <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {similar.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Networks */}
        {series.networks && series.networks.length > 0 && (
          <section className="space-y-6 pb-8 mt-10">
            <h2 className="text-2xl font-bold">Networks</h2>
            <div className="flex flex-wrap gap-4">
              {series.networks.map((network) => (
                <div
                  key={network.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50"
                >
                  {network.logo_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${network.logo_path}`}
                      alt={network.name}
                      className="h-8 w-auto object-contain filter dark:invert"
                    />
                  ) : (
                    <Tv className="h-6 w-6 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">{network.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
