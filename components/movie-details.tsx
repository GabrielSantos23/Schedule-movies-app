"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ArrowLeft, 
  Play, 
  Star, 
  Clock, 
  Calendar, 
  Film, 
  Users,
  ExternalLink,
  Heart,
  Share2,
  Bookmark
} from "lucide-react"

interface MovieDetails {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  runtime: number
  genres: { id: number; name: string }[]
  tagline: string
  status: string
  budget: number
  revenue: number
  production_companies: { id: number; name: string; logo_path: string | null }[]
  spoken_languages: { english_name: string }[]
  credits: {
    cast: {
      id: number
      name: string
      character: string
      profile_path: string | null
    }[]
    crew: {
      id: number
      name: string
      job: string
      profile_path: string | null
    }[]
  }
  trailer: {
    key: string
    name: string
    site: string
  } | null
  similar: {
    id: number
    title: string
    poster_path: string | null
    vote_average: number
  }[]
}

function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

function formatCurrency(amount: number): string {
  if (amount === 0) return "N/A"
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
}

export default function MovieDetailsClient({ movieId }: { movieId: string }) {
  const [movie, setMovie] = useState<MovieDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTrailer, setShowTrailer] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await fetch(`/api/tmdb/movie/${movieId}`)
        if (!response.ok) throw new Error("Failed to fetch movie")
        const data = await response.json()
        setMovie(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load movie")
      } finally {
        setIsLoading(false)
      }
    }
    fetchMovie()
  }, [movieId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative h-[70vh] bg-muted animate-pulse" />
        <div className="container mx-auto px-4 -mt-32 relative z-10">
          <div className="flex gap-8">
            <Skeleton className="w-64 h-96 rounded-xl shrink-0" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Film className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Movie not found</h1>
          <p className="text-muted-foreground">{error || "Unable to load movie details"}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const directors = movie.credits.crew.filter(c => c.job === "Director")
  const writers = movie.credits.crew.filter(c => c.job === "Screenplay" || c.job === "Writer")

  return (
    <div className="min-h-screen bg-background">
      {/* Trailer Modal */}
      {showTrailer && movie.trailer && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowTrailer(false)}
        >
          <div className="relative w-full max-w-5xl aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${movie.trailer.key}?autoplay=1`}
              title={movie.trailer.name}
              className="w-full h-full rounded-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <button 
            className="absolute top-4 right-4 text-white hover:text-primary transition-colors"
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
          {movie.backdrop_path ? (
            <img
              src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
              alt={movie.title}
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
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="relative z-10 container mx-auto px-4 pt-12 ">
          <div className="grid lg:grid-cols-[1fr,1.5fr] gap-8 items-end">
            {/* Left: Movie Info */}
            <div className="space-y-6 max-w-xl">
              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  {movie.title}
                </h1>
                {movie.tagline && (
                  <p className="text-lg text-white/60 italic">"{movie.tagline}"</p>
                )}
              </div>

              {/* Overview */}
              <p className="text-white/80 text-base md:text-lg leading-relaxed line-clamp-4">
                {movie.overview}
              </p>

              {/* Cast Avatars */}
              {movie.credits.cast.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {movie.credits.cast.slice(0, 5).map((actor) => (
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
                    {movie.credits.cast.length > 5 && (
                      <div className="h-12 w-12 rounded-full border-2 border-background bg-muted/80 flex items-center justify-center text-sm font-medium text-white">
                        +{movie.credits.cast.length - 5}
                      </div>
                    )}
                  </div>
                  <div className="text-white/60 text-sm">
                    {movie.credits.cast.slice(0, 3).map(a => a.name.split(' ')[0]).join(', ')}
                    {movie.credits.cast.length > 3 && ' & More'}
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
                  <span className="text-2xl font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                  <span className="text-white/50">/10</span>
                </div>

                {/* Runtime */}
                {movie.runtime > 0 && (
                  <div className="flex items-center gap-2 text-white/70">
                    <Clock className="h-4 w-4" />
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>
                )}

                {/* Year */}
                {movie.release_date && (
                  <div className="flex items-center gap-2 text-white/70">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                  </div>
                )}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <Badge 
                    key={genre.id} 
                    variant="outline" 
                    className="border-white/30 text-white bg-white/10 hover:bg-white/20"
                  >
                    {genre.name}
                  </Badge>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2  bottom-4">
                {movie.trailer && (
                  <Button 
                    size="lg" 
                    className="gap-2 bg-white text-black hover:bg-white/90"
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
      <div className="container mx-auto px-4 ">
        {movie.credits.cast.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Cast</h2>
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {movie.credits.cast.map((actor) => (
                  <div key={actor.id} className="flex-shrink-0 w-32 text-center group">
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
                    <p className="font-medium text-sm line-clamp-1">{actor.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{actor.character}</p>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>
        )}

            <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {directors.length > 0 && (
            <div className="space-y-2 p-4 rounded-xl bg-muted/50">
              <h3 className="text-sm text-muted-foreground font-medium">Director</h3>
              <p className="font-semibold">{directors.map(d => d.name).join(', ')}</p>
            </div>
          )}

          {/* Writers */}
          {writers.length > 0 && (
            <div className="space-y-2 p-4 rounded-xl bg-muted/50">
              <h3 className="text-sm text-muted-foreground font-medium">Writers</h3>
              <p className="font-semibold">{writers.slice(0, 2).map(w => w.name).join(', ')}</p>
            </div>
          )}

          {/* Budget */}
          <div className="space-y-2 p-4 rounded-xl bg-muted/50">
            <h3 className="text-sm text-muted-foreground font-medium">Budget</h3>
            <p className="font-semibold">{formatCurrency(movie.budget)}</p>
          </div>

          {/* Revenue */}
          <div className="space-y-2 p-4 rounded-xl bg-muted/50">
            <h3 className="text-sm text-muted-foreground font-medium">Box Office</h3>
            <p className="font-semibold">{formatCurrency(movie.revenue)}</p>
          </div>

          {/* Status */}
          <div className="space-y-2 p-4 rounded-xl bg-muted/50">
            <h3 className="text-sm text-muted-foreground font-medium">Status</h3>
            <p className="font-semibold">{movie.status}</p>
          </div>

          {/* Language */}
          {movie.spoken_languages.length > 0 && (
            <div className="space-y-2 p-4 rounded-xl bg-muted/50">
              <h3 className="text-sm text-muted-foreground font-medium">Language</h3>
              <p className="font-semibold">{movie.spoken_languages[0].english_name}</p>
            </div>
          )}

          {/* Vote Count */}
          <div className="space-y-2 p-4 rounded-xl bg-muted/50">
            <h3 className="text-sm text-muted-foreground font-medium">Votes</h3>
            <p className="font-semibold">{movie.vote_count.toLocaleString()}</p>
          </div>

          {/* Release Date */}
          <div className="space-y-2 p-4 rounded-xl bg-muted/50">
            <h3 className="text-sm text-muted-foreground font-medium">Release Date</h3>
            <p className="font-semibold">
              {new Date(movie.release_date).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </section>

        {movie.similar.length > 0 && (
          <section className="space-y-6 mt-10">
            <h2 className="text-2xl font-bold">Similar Movies</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {movie.similar.map((similar) => (
                <Link 
                  key={similar.id} 
                  href={`/movie/${similar.id}`}
                  className="group"
                >
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted shadow-lg group-hover:shadow-xl transition-all group-hover:-translate-y-1">
                    {similar.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w342${similar.poster_path}`}
                        alt={similar.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span>{similar.vote_average.toFixed(1)}</span>
                    </div>
                    <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {similar.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Production Companies */}
        {movie.production_companies.length > 0 && (
          <section className="space-y-6 pb-8 mt-10">
            <h2 className="text-2xl font-bold">Production</h2>
            <div className="flex flex-wrap gap-4">
              {movie.production_companies.map((company) => (
                <div 
                  key={company.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50"
                >
                  {company.logo_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${company.logo_path}`}
                      alt={company.name}
                      className="h-8 w-auto object-contain filter dark:invert"
                    />
                  ) : (
                    <Film className="h-6 w-6 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">{company.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
