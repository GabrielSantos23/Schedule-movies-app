"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  CalendarIcon,
  Film,
  Search,
  Share2,
  Copy,
  Check,
  Users,
  Trash2,
  Plus,
  Loader2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  Home,
  ListVideo,
  Clock,
  Sparkles,
  Tv,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { ThemeToggle } from "@/components/theme-toggle";

interface Movie {
  id: number;
  title?: string;
  name?: string; // For TV series
  overview: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string; // For TV series
  vote_average: number;
  media_type?: "movie" | "tv";
}

interface GroupSchedule {
  id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  movie_overview: string | null;
  scheduled_date: string | null;
  user_id: string;
  user_email?: string;
  schedule_votes?: { user_id: string }[];
  media_type?: "movie" | "tv";
}

interface Group {
  id: string;
  name: string;
  description: string | null;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  profiles?: { email: string };
}

// Helper to parse date strings without timezone issues
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Movie Card Component
function MovieCard({
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

// Horizontal scroll row component
function MovieRow({
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

export default function GroupScheduler({
  user,
  groupId,
}: {
  user: User;
  groupId: string;
}) {
  const [isAddMovieOpen, setIsAddMovieOpen] = useState(false);
  const [processingStates, setProcessingStates] = useState<
    Record<string, "vote" | "delete">
  >({});
  const [scheduleToDelete, setScheduleToDelete] =
    useState<GroupSchedule | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [resultsPage, setResultsPage] = useState(0);
  const [schedules, setSchedules] = useState<GroupSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("movies");
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadGroup();
    loadMembers();
    loadSchedules();
  }, [groupId]);

  const loadGroup = async () => {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();
    if (error) return;
    setGroup(data);
  };

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from("group_members")
      .select("id, user_id, role")
      .eq("group_id", groupId);
    if (error) return;
    setMembers(data);
  };

  const loadSchedules = async () => {
    const { data, error } = await supabase
      .from("group_schedules")
      .select("*, schedule_votes(user_id)")
      .eq("group_id", groupId)
      .order("scheduled_date", { ascending: true });
    if (error) return;
    setSchedules(data || []);
  };

  const searchMovies = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/tmdb/search?query=${encodeURIComponent(searchQuery)}`
      );
      if (!response.ok) throw new Error("Failed to search movies");
      const data = await response.json();
      setMovies(data.results || []);
      setResultsPage(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search movies");
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleMovie = async (movie: Movie) => {
    const title = movie.title || movie.name || "Unknown";
    const mediaType = movie.media_type || "movie";

    const { error } = await supabase.from("group_schedules").insert({
      group_id: groupId,
      user_id: user.id,
      movie_id: movie.id,
      movie_title: title,
      movie_poster: movie.poster_path,
      movie_overview: movie.overview,
      scheduled_date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : null,
      media_type: mediaType,
    });
    if (error) {
      if (error.code === "23505") {
        setError("This item is already in the list");
      } else {
        setError("Failed to add item");
      }
      return;
    }
    loadSchedules();
    setSelectedDate(undefined);
  };

  const removeSchedule = async (id: string) => {
    setProcessingStates((prev) => ({ ...prev, [id]: "delete" }));
    try {
      const { error } = await supabase
        .from("group_schedules")
        .delete()
        .eq("id", id);
      if (error) {
        setError("Failed to remove schedule");
        return;
      }
      loadSchedules();
    } finally {
      setProcessingStates((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleConfirmDelete = () => {
    if (scheduleToDelete) {
      removeSchedule(scheduleToDelete.id);
      setScheduleToDelete(null);
    }
  };

  const generateInviteLink = async () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const { data, error } = await supabase
      .from("invite_links")
      .insert({
        group_id: groupId,
        code: code,
        created_by: user.id,
        max_uses: null,
        expires_at: null,
      })
      .select()
      .single();
    if (error) return;
    const link = `${window.location.origin}/invite/${code}`;
    setInviteLink(link);
  };

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const [editingSchedule, setEditingSchedule] = useState<GroupSchedule | null>(
    null
  );
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);

  const updateSchedule = async () => {
    if (!editingSchedule) return;
    const { error } = await supabase
      .from("group_schedules")
      .update({
        scheduled_date: editDate ? format(editDate, "yyyy-MM-dd") : null,
      })
      .eq("id", editingSchedule.id);
    if (error) {
      setError("Failed to update schedule");
      return;
    }
    setEditingSchedule(null);
    loadSchedules();
  };

  const toggleVote = async (schedule: GroupSchedule) => {
    setProcessingStates((prev) => ({ ...prev, [schedule.id]: "vote" }));
    try {
      const hasVoted = schedule.schedule_votes?.some(
        (v) => v.user_id === user.id
      );
      if (hasVoted) {
        await supabase
          .from("schedule_votes")
          .delete()
          .match({ schedule_id: schedule.id, user_id: user.id });
      } else {
        await supabase
          .from("schedule_votes")
          .insert({ schedule_id: schedule.id, user_id: user.id });
      }
      loadSchedules();
    } finally {
      setProcessingStates((prev) => {
        const next = { ...prev };
        delete next[schedule.id];
        return next;
      });
    }
  };

  // Sort schedules by votes (most voted first)
  const sortedByVotes = [...schedules].sort(
    (a, b) => (b.schedule_votes?.length || 0) - (a.schedule_votes?.length || 0)
  );
  const topVoted = sortedByVotes.slice(0, 10);

  // Sort scheduled movies by date (ascending)
  const scheduledMovies = schedules
    .filter((s) => s.scheduled_date)
    .sort(
      (a, b) =>
        parseLocalDate(a.scheduled_date!).getTime() -
        parseLocalDate(b.scheduled_date!).getTime()
    );
  const unscheduledMovies = schedules.filter((s) => !s.scheduled_date);

  // Calculate date range title for scheduled movies
  const getScheduledDateRange = () => {
    if (scheduledMovies.length === 0) return "Scheduled";

    // Get the raw date strings to avoid timezone issues
    const firstDateStr = scheduledMovies[0].scheduled_date!;
    const lastDateStr =
      scheduledMovies[scheduledMovies.length - 1].scheduled_date!;

    // Parse dates by splitting the string to avoid timezone shifts
    const [firstYear, firstMonth, firstDay] = firstDateStr
      .split("-")
      .map(Number);
    const [lastYear, lastMonth, lastDay] = lastDateStr.split("-").map(Number);

    const firstDate = new Date(firstYear, firstMonth - 1, firstDay);
    const lastDate = new Date(lastYear, lastMonth - 1, lastDay);

    // Same exact date
    if (firstDateStr === lastDateStr) {
      return format(firstDate, "MMM d");
    }

    // Check if same month and year
    if (firstMonth === lastMonth && firstYear === lastYear) {
      return `${format(firstDate, "MMM d")} - ${format(lastDate, "d")}`;
    }

    return `${format(firstDate, "MMM d")} - ${format(lastDate, "MMM d")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Search Movie Dialog */}
      <Dialog open={isAddMovieOpen} onOpenChange={setIsAddMovieOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50">
          <div className="p-6 pb-4 space-y-4 border-b border-border/50">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" /> Find a Movie
              </DialogTitle>
            </DialogHeader>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search movies and series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchMovies()}
                  className="pl-10 h-11 bg-muted/50 border-none"
                />
              </div>
              <Button
                onClick={searchMovies}
                disabled={isLoading}
                className="h-11 px-6"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : "Search"}
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-6">
            {movies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {movies
                  .slice(resultsPage * 6, (resultsPage + 1) * 6)
                  .map((movie) => {
                    const displayTitle = movie.title || movie.name || "Unknown";
                    const releaseYear = (
                      movie.release_date || movie.first_air_date
                    )?.split("-")[0];
                    const isTvSeries = movie.media_type === "tv";

                    return (
                      <div
                        key={`${movie.media_type}-${movie.id}`}
                        className="group cursor-pointer"
                      >
                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-md transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                          {movie.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {isTvSeries ? (
                                <Tv className="h-8 w-8 opacity-20" />
                              ) : (
                                <Film className="h-8 w-8 opacity-20" />
                              )}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                            <div className="flex gap-2 w-full">
                              <Button
                                size="sm"
                                className="flex-1 h-8 text-xs"
                                onClick={() => {
                                  scheduleMovie(movie);
                                  setIsAddMovieOpen(false);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Add
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <CalendarIcon className="h-3.5 w-3.5" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    disabled={{ before: new Date() }}
                                    className="rounded-md border m-4"
                                  />
                                  <div className="p-3 border-t bg-muted/50 flex justify-end">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        scheduleMovie(movie);
                                        setIsAddMovieOpen(false);
                                      }}
                                    >
                                      Confirm & Add
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                          {/* Rating badge */}
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs font-medium flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            {movie.vote_average?.toFixed(1)}
                          </div>
                          {/* Media type badge */}
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs font-medium flex items-center gap-1">
                            {isTvSeries ? (
                              <>
                                <Tv className="h-3 w-3" />
                                <span>Series</span>
                              </>
                            ) : (
                              <>
                                <Film className="h-3 w-3" />
                                <span>Movie</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-medium line-clamp-1">
                            {displayTitle}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {releaseYear}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-4 py-12 opacity-50">
                <Film className="h-12 w-12" />
                <p>Search for movies and series to add to your list.</p>
              </div>
            )}
          </ScrollArea>

          {movies.length > 6 && (
            <div className="p-4 border-t border-border/50 flex items-center justify-between">
              <span className="text-xs text-muted-foreground ml-2">
                Page {resultsPage + 1} of {Math.ceil(movies.length / 6)}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResultsPage((p) => Math.max(0, p - 1))}
                  disabled={resultsPage === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setResultsPage((p) =>
                      Math.min(Math.ceil(movies.length / 6) - 1, p + 1)
                    )
                  }
                  disabled={resultsPage >= Math.ceil(movies.length / 6) - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog
        open={!!scheduleToDelete}
        onOpenChange={(open) => !open && setScheduleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from list?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{scheduleToDelete?.movie_title}" from your
              group's movie list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingSchedule}
        onOpenChange={(open) => !open && setEditingSchedule(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Date (Optional)</Label>
              <div className="border rounded-md p-4 flex justify-center">
                <Calendar
                  mode="single"
                  selected={editDate}
                  onSelect={setEditDate}
                  disabled={{ before: new Date() }}
                  className="rounded-md border shadow-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingSchedule(null)}
              >
                Cancel
              </Button>
              <Button onClick={updateSchedule}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-10">
        {/* Stats Bar */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{members.length} members</span>
          </div>
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4" />
            <span>{schedules.length} movies</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span>{scheduledMovies.length} scheduled</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Dialog
              open={isInviteDialogOpen}
              onOpenChange={setIsInviteDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => !inviteLink && generateInviteLink()}
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Invite</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Invite to Group
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Share this link with friends to invite them to the group.
                  </p>
                  {inviteLink ? (
                    <div className="flex gap-2">
                      <Input
                        value={inviteLink}
                        readOnly
                        className="bg-muted/50"
                      />
                      <Button
                        onClick={copyInviteLink}
                        variant="secondary"
                        className="flex-shrink-0"
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={() => setIsAddMovieOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Movie</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <div className="relative h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                <Film className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">No movies yet</h2>
              <p className="text-muted-foreground max-w-md">
                Start building your group's movie list. Search for movies and
                add them to watch together!
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setIsAddMovieOpen(true)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Add Your First Movie
            </Button>
          </div>
        ) : (
          <>
            {/* Most Voted */}
            {topVoted.length > 0 &&
              topVoted.some((s) => (s.schedule_votes?.length || 0) > 0) && (
                <MovieRow
                  title="Most Voted"
                  icon={Heart}
                  schedules={topVoted.filter(
                    (s) => (s.schedule_votes?.length || 0) > 0
                  )}
                  user={user}
                  onVote={toggleVote}
                  onEdit={(s) => {
                    setEditingSchedule(s);
                    setEditDate(
                      s.scheduled_date
                        ? parseLocalDate(s.scheduled_date)
                        : undefined
                    );
                  }}
                  onDelete={(s) => setScheduleToDelete(s)}
                  processingStates={processingStates}
                />
              )}

            {/* Scheduled Movies */}
            {scheduledMovies.length > 0 && (
              <MovieRow
                title={getScheduledDateRange()}
                icon={Clock}
                schedules={scheduledMovies}
                user={user}
                onVote={toggleVote}
                onEdit={(s) => {
                  setEditingSchedule(s);
                  setEditDate(
                    s.scheduled_date
                      ? parseLocalDate(s.scheduled_date)
                      : undefined
                  );
                }}
                onDelete={(s) => setScheduleToDelete(s)}
                processingStates={processingStates}
              />
            )}

            {/* Watchlist (Unscheduled) */}
            {unscheduledMovies.length > 0 && (
              <MovieRow
                title="Watchlist"
                icon={ListVideo}
                schedules={unscheduledMovies}
                user={user}
                onVote={toggleVote}
                onEdit={(s) => {
                  setEditingSchedule(s);
                  setEditDate(undefined);
                }}
                onDelete={(s) => setScheduleToDelete(s)}
                processingStates={processingStates}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
