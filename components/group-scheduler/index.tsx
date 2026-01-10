"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { format } from "date-fns";
import { User } from "@supabase/supabase-js";
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
  Star,
  ListVideo,
  Clock,
  Sparkles,
  Tv,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { ThemeToggle } from "@/components/theme-toggle";

import { Movie, GroupSchedule, Group, Member, parseLocalDate } from "./types";
import { MovieRow } from "./movie-row";

export default function GroupScheduler({
  user,
  groupId,
}: {
  user: User;
  groupId: string;
}) {
  // --- ESTADOS ---
  const [isAddMovieOpen, setIsAddMovieOpen] = useState(false);
  const [processingStates, setProcessingStates] = useState<
    Record<string, "vote" | "delete" | "watch">
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
  const [activeTab, setActiveTab] = useState<"watchlist" | "history">(
    "watchlist"
  );
  const [editingSchedule, setEditingSchedule] = useState<GroupSchedule | null>(
    null
  );
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);

  const supabase = createClient();

  // --- EFEITOS E CARREGAMENTO ---
  useEffect(() => {
    loadGroup();
    loadMembers();
    loadSchedules();
  }, [groupId]);

  const loadGroup = async () => {
    const { data } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();
    if (data) setGroup(data);
  };

  const loadMembers = async () => {
    const { data } = await supabase
      .from("group_members")
      .select("id, user_id, role")
      .eq("group_id", groupId);
    if (data) setMembers(data);
  };

  const loadSchedules = async () => {
    const { data } = await supabase
      .from("group_schedules")
      .select("*, schedule_votes(user_id)")
      .eq("group_id", groupId)
      .order("scheduled_date", { ascending: true });
    setSchedules(data || []);
  };

  // --- AÇÕES ---
  const searchMovies = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/tmdb/search?query=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setMovies(data.results || []);
      setResultsPage(0);
    } catch (err) {
      setError("Failed search");
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleMovie = async (movie: Movie) => {
    const { error } = await supabase.from("group_schedules").insert({
      group_id: groupId,
      user_id: user.id,
      movie_id: movie.id,
      movie_title: movie.title || movie.name,
      movie_poster: movie.poster_path,
      movie_overview: movie.overview,
      scheduled_date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : null,
      media_type: movie.media_type || "movie",
      vote_average: movie.vote_average,
    });
    if (!error) {
      loadSchedules();
      setSelectedDate(undefined);
    }
  };

  const removeSchedule = async (id: string) => {
    setProcessingStates((prev) => ({ ...prev, [id]: "delete" }));
    await supabase.from("group_schedules").delete().eq("id", id);
    loadSchedules();
    setProcessingStates((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  };

  const updateSchedule = async () => {
    if (!editingSchedule) return;
    await supabase
      .from("group_schedules")
      .update({
        scheduled_date: editDate ? format(editDate, "yyyy-MM-dd") : null,
      })
      .eq("id", editingSchedule.id);
    setEditingSchedule(null);
    loadSchedules();
  };

  const markAsWatched = async (s: GroupSchedule) => {
    await supabase
      .from("group_schedules")
      .update({ watched: true, scheduled_date: null })
      .eq("id", s.id);
    loadSchedules();
  };

  const moveToWatchlist = async (s: GroupSchedule) => {
    await supabase
      .from("group_schedules")
      .update({ watched: false })
      .eq("id", s.id);
    loadSchedules();
  };

  const generateInviteLink = async () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    await supabase
      .from("invite_links")
      .insert({ group_id: groupId, code, created_by: user.id });
    setInviteLink(`${window.location.origin}/invite/${code}`);
  };

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // --- FILTROS ---
  const scheduledMovies = schedules.filter(
    (s) => s.scheduled_date && !s.watched
  );
  const unscheduledMovies = schedules.filter(
    (s) => !s.scheduled_date && !s.watched
  );
  const watchedMovies = schedules
    .filter((s) => s.watched)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const getScheduledDateRange = () => {
    if (scheduledMovies.length === 0) return "Scheduled";
    const first = parseLocalDate(scheduledMovies[0].scheduled_date!);
    const last = parseLocalDate(
      scheduledMovies[scheduledMovies.length - 1].scheduled_date!
    );
    if (
      scheduledMovies[0].scheduled_date ===
      scheduledMovies[scheduledMovies.length - 1].scheduled_date
    )
      return format(first, "MMM d");
    return `${format(first, "MMM d")} - ${format(last, "MMM d")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* DIALOG DE BUSCA */}
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
                  placeholder="Search movies..."
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
                  .map((movie) => (
                    <div key={movie.id} className="group cursor-pointer">
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-md transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                        {movie.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {movie.media_type === "tv" ? (
                              <Tv className="opacity-20" />
                            ) : (
                              <Film className="opacity-20" />
                            )}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              scheduleMovie(movie);
                              setIsAddMovieOpen(false);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-12 opacity-50">
                <Film className="h-12 w-12" />
                <p>Search for something!</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE DELETAR */}
      <AlertDialog
        open={!!scheduleToDelete}
        onOpenChange={(open) => !open && setScheduleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from list?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove "{scheduleToDelete?.movie_title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                scheduleToDelete && removeSchedule(scheduleToDelete.id)
              }
              className="bg-destructive"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIALOG DE EDIÇÃO */}
      <Dialog
        open={!!editingSchedule}
        onOpenChange={(open) => !open && setEditingSchedule(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label>Select Date (Optional)</Label>
            <Calendar
              mode="single"
              selected={editDate}
              onSelect={setEditDate}
              disabled={{ before: new Date() }}
              className="rounded-md border mx-auto"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingSchedule(null)}
              >
                Cancel
              </Button>
              <Button onClick={updateSchedule}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- HEADER E CONTEÚDO PRINCIPAL --- */}
      <main className="container mx-auto px-4 py-8 space-y-10">
        {/* STATS BAR (SEU HEADER ORIGINAL) */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" /> <span>{members.length} members</span>
          </div>
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4" /> <span>{schedules.length} movies</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />{" "}
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite to Group</DialogTitle>
                </DialogHeader>
                <div className="flex gap-2 py-4">
                  <Input value={inviteLink || ""} readOnly />
                  <Button onClick={copyInviteLink}>
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={() => setIsAddMovieOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Movie or TV Show</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* TABS */}
        <div className="mt-6 flex items-center gap-4 border-b border-border/50">
          {["watchlist", "history"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-3 text-sm font-medium capitalize relative ${
                activeTab === tab ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {tab}{" "}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* LISTAS */}
        {activeTab === "watchlist" ? (
          schedules.filter((s) => !s.watched).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <div className="relative h-24 w-24 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Film className="h-10 w-10 text-primary" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold">No movies in watchlist</h2>
                <p className="text-muted-foreground">
                  Start building your group's movie list!
                </p>
              </div>
              <Button onClick={() => setIsAddMovieOpen(true)} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Add Your First Movie
              </Button>
            </div>
          ) : (
            <>
              <MovieRow
                title={getScheduledDateRange()}
                icon={Clock}
                schedules={scheduledMovies}
                user={user}
                onEdit={(s) => {
                  setEditingSchedule(s);
                  setEditDate(
                    s.scheduled_date
                      ? parseLocalDate(s.scheduled_date)
                      : undefined
                  );
                }}
                onDelete={setScheduleToDelete}
                onToggleWatched={markAsWatched}
                processingStates={processingStates}
              />
              <MovieRow
                title="Watchlist"
                icon={ListVideo}
                schedules={unscheduledMovies}
                user={user}
                onEdit={(s) => {
                  setEditingSchedule(s);
                  setEditDate(undefined);
                }}
                onDelete={setScheduleToDelete}
                onToggleWatched={markAsWatched}
                processingStates={processingStates}
              />
            </>
          )
        ) : (
          <MovieRow
            title="History"
            icon={Check}
            schedules={watchedMovies}
            user={user}
            onEdit={() => {}}
            onDelete={setScheduleToDelete}
            onToggleWatched={moveToWatchlist}
            processingStates={processingStates}
          />
        )}
      </main>
    </div>
  );
}
