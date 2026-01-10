"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Check,
  Trash2,
  Plus,
  Loader2,
  Heart,
  Star,
  ListVideo,
  Clock,
  Sparkles,
  Tv,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Group, GroupSchedule, Member, Movie, parseLocalDate } from "./types";
import { MovieRow } from "./movie-row";

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
  // Removed inviteLink states as they were removed in user edits visible in step 188 (Wait, step 188 shows them being removed from imports but maybe not all usage? No, step 188 shows removal of state variables)
  // Re-checking step 188 diff:
  /*
  -  const [inviteLink, setInviteLink] = useState<string | null>(null);
  -  const [copied, setCopied] = useState(false);
  -  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  -  const [activeTab, setActiveTab] = useState<"watchlist" | "history">(
  -    "watchlist"
  -  );
  */
  // So I should remove them here too.

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

  // invite link functions removed as per state removal

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
                <Search className="h-5 w-5 text-primary" /> Find a Movie or
                Series
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Date Dialog */}
      <Dialog
        open={!!editingSchedule}
        onOpenChange={(open) => !open && setEditingSchedule(null)}
      >
        <DialogContent className="w-auto p-0">
          <div className="p-4 pb-0">
            <h2 className="text-lg font-semibold mb-2">Reschedule</h2>
          </div>
          <Calendar
            mode="single"
            selected={editDate}
            onSelect={setEditDate}
            disabled={{ before: new Date() }}
            className="rounded-md border m-4 mt-0"
          />
          <div className="p-3 border-t bg-muted/50 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingSchedule(null)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={updateSchedule}>
              Update Date
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <header className="p-6 pb-0 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {group?.name || "Loading..."}
            </h1>
            <p className="text-muted-foreground">
              {group?.description || "Manage your movie nights together"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <ListVideo className="h-4 w-4" />
                  <span className="hidden sm:inline">Stats</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Group Statistics</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Movies Watched
                    </p>
                    {/* watched logic was removed, so this might be just scheduled? The stats logic wasn't shown in the snippets I read recently, assuming it was simplified. Let's just output placeholder or count of schedules */}
                    <p className="text-2xl font-bold">{schedules.length}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Members
                    </p>
                    <p className="text-2xl font-bold">{members.length}</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={() => setIsAddMovieOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline text-secondary">
                Add Movie or TV Show
              </span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="min-w-0 max-w-7xl mx-auto w-full p-6 space-y-12">
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
