"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { format, formatDistanceToNow } from "date-fns";
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
  Activity,
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

import {
  Movie,
  GroupSchedule,
  Group,
  Member,
  GroupActivity,
  parseLocalDate,
} from "./types";
import { MovieRow } from "./movie-row";
import { ActivityFeed } from "./activity-feed";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [schedules, setSchedules] = useState<GroupSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "watchlist" | "history" | "activity"
  >("watchlist");
  const [editingSchedule, setEditingSchedule] = useState<GroupSchedule | null>(
    null
  );
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [activities, setActivities] = useState<GroupActivity[]>([]);

  const supabase = createClient();

  useEffect(() => {
    loadGroup();
    loadMembers();
    loadSchedules();
    loadActivities();
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
    // 1. Get group members
    const { data: membersData, error: membersError } = await supabase
      .from("group_members")
      .select("id, user_id, role")
      .eq("group_id", groupId);

    if (membersError || !membersData) {
      console.error("Error loading members:", membersError);
      return;
    }

    // 2. Get profiles for these users
    const userIds = membersData.map((m) => m.user_id);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url")
      .in("id", userIds);

    // 3. Merge data
    const membersWithProfiles = membersData.map((member) => {
      const profile = profilesData?.find((p) => p.id === member.user_id);
      return {
        ...member,
        profiles: profile,
      };
    });

    setMembers(membersWithProfiles as any);
  };

  const loadSchedules = async () => {
    const { data } = await supabase
      .from("group_schedules")
      .select(
        "*, schedule_votes(user_id), schedule_interests(id, user_id, interested)"
      )
      .eq("group_id", groupId)
      .order("scheduled_date", { ascending: true });
    setSchedules(data || []);
  };

  const loadActivities = async () => {
    const { data } = await supabase
      .from("group_activities")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setActivities(data as any);
  };

  const logActivity = async (
    action: GroupActivity["action"],
    movieTitle?: string
  ) => {
    const { error } = await supabase.from("group_activities").insert({
      group_id: groupId,
      user_id: user.id,
      action,
      movie_title: movieTitle,
    });

    if (error) {
      console.error("Error logging activity:", error);
    }

    // Refresh activities quietly
    const { data } = await supabase
      .from("group_activities")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setActivities(data as any);
  };

  // --- AÇÕES ---
  const searchMovies = async (page: number = 1) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/tmdb/search?query=${encodeURIComponent(searchQuery)}&page=${page}`
      );
      const data = await response.json();

      if (page === 1) {
        setMovies(data.results || []);
        setCurrentPage(1);
      } else {
        setMovies((prev) => [...prev, ...(data.results || [])]);
      }

      setHasMoreResults(data.page < data.total_pages);
      setResultsPage(0);
    } catch (err) {
      setError("Failed search");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreMovies = async () => {
    if (isLoadingMore || !hasMoreResults) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const response = await fetch(
        `/api/tmdb/search?query=${encodeURIComponent(
          searchQuery
        )}&page=${nextPage}`
      );
      const data = await response.json();

      setMovies((prev) => [...prev, ...(data.results || [])]);
      setCurrentPage(nextPage);
      setHasMoreResults(data.page < data.total_pages);
    } catch (err) {
      console.error("Failed to load more:", err);
    } finally {
      setIsLoadingMore(false);
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
      logActivity("added_movie", movie.title || movie.name);
      loadSchedules();
      setSelectedDate(undefined);
    }
  };

  const removeSchedule = async (id: string, movieTitle?: string) => {
    setProcessingStates((prev) => ({ ...prev, [id]: "delete" }));
    await supabase.from("group_schedules").delete().eq("id", id);
    if (movieTitle) logActivity("removed_movie", movieTitle);
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

    if (editDate) {
      logActivity("scheduled_movie", editingSchedule.movie_title);
    } else if (editingSchedule.scheduled_date) {
      logActivity("removed_date", editingSchedule.movie_title);
    }

    setEditingSchedule(null);
    loadSchedules();
  };

  const markAsWatched = async (s: GroupSchedule) => {
    await supabase
      .from("group_schedules")
      .update({ watched: true, scheduled_date: null })
      .eq("id", s.id);
    logActivity("marked_watched", s.movie_title);
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

  const toggleInterest = async (
    scheduleId: string,
    currentlyInterested: boolean | null
  ) => {
    if (currentlyInterested === null) {
      // No interest record exists, create one
      await supabase.from("schedule_interests").insert({
        schedule_id: scheduleId,
        user_id: user.id,
        interested: true,
      });
    } else {
      // Toggle existing interest
      await supabase
        .from("schedule_interests")
        .update({ interested: !currentlyInterested })
        .eq("schedule_id", scheduleId)
        .eq("user_id", user.id);
    }

    if (currentlyInterested === null) {
      const schedule = schedules.find((s) => s.id === scheduleId);
      if (schedule) logActivity("showed_interest", schedule.movie_title);
    }

    loadSchedules();
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
        <DialogContent className="sm:max-w-[600px] h-[65vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50 overflow-hidden">
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
                onClick={() => searchMovies()}
                disabled={isLoading}
                className="h-11 px-6"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : "Search"}
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[calc(65vh-140px)]">
            <div className="p-6">
              {movies.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {movies.map((movie) => {
                      const isAlreadyAdded = schedules.some(
                        (s) => s.movie_id === movie.id
                      );

                      return (
                        <div key={movie.id} className="group cursor-pointer">
                          <div
                            className={`relative aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-md transition-all ${
                              isAlreadyAdded
                                ? "opacity-60"
                                : "group-hover:shadow-xl group-hover:-translate-y-1"
                            }`}
                          >
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

                            {isAlreadyAdded ? (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <div className="flex items-center gap-1.5 text-white bg-primary/80 px-3 py-1.5 rounded-full text-sm font-medium">
                                  <Check className="h-4 w-4" />
                                  Added
                                </div>
                              </div>
                            ) : (
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
                            )}
                          </div>
                          <div className="mt-2 px-1">
                            <p className="text-sm font-medium leading-tight line-clamp-1">
                              {movie.title || movie.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {movie.release_date || movie.first_air_date
                                ? new Date(
                                    movie.release_date || movie.first_air_date!
                                  ).getFullYear()
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {isLoadingMore && (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}

                  {!hasMoreResults && movies.length > 0 && (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      No more results
                    </div>
                  )}

                  {hasMoreResults && !isLoadingMore && (
                    <div className="flex justify-center py-6">
                      <Button
                        variant="outline"
                        onClick={() => loadMoreMovies()}
                      >
                        Load more
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-12 opacity-50">
                  <Film className="h-12 w-12" />
                  <p>Search for something!</p>
                </div>
              )}
            </div>
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
                scheduleToDelete &&
                removeSchedule(
                  scheduleToDelete.id,
                  scheduleToDelete.movie_title
                )
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
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="flex items-center gap-2 cursor-help hover:text-foreground transition-colors">
                  <Users className="h-4 w-4" />{" "}
                  <span>{members.length} members</span>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-60">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Group Members</h4>
                  <div className="grid gap-2">
                    <ScrollArea className="h-[200px]">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between text-sm py-1"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              {member.profiles?.avatar_url && (
                                <AvatarImage src={member.profiles.avatar_url} />
                              )}
                              <AvatarFallback className="text-[10px]">
                                {(
                                  member.profiles?.full_name ||
                                  member.profiles?.email ||
                                  "?"
                                )
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-[140px]">
                              {member.user_id === user.id
                                ? "You"
                                : member.profiles?.full_name ||
                                  (member.profiles?.email &&
                                    member.profiles.email
                                      .split("@")[0]
                                      .charAt(0)
                                      .toUpperCase() +
                                      member.profiles.email
                                        .split("@")[0]
                                        .slice(1)) ||
                                  "Member"}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground capitalize">
                            {member.role}
                          </span>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
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
          {["watchlist", "history", "activity"].map((tab) => (
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
        {activeTab === "watchlist" &&
          (schedules.filter((s) => !s.watched).length === 0 ? (
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
                onToggleInterest={toggleInterest}
                processingStates={processingStates}
                totalMembers={members.length}
                members={members}
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
                onToggleInterest={toggleInterest}
                processingStates={processingStates}
                totalMembers={members.length}
                members={members}
              />
            </>
          ))}

        {/* HISTORY */}
        {activeTab === "history" && (
          <MovieRow
            title="History"
            icon={Check}
            schedules={watchedMovies}
            user={user}
            onEdit={() => {}}
            onDelete={setScheduleToDelete}
            onToggleWatched={moveToWatchlist}
            onToggleInterest={toggleInterest}
            processingStates={processingStates}
            totalMembers={members.length}
          />
        )}

        {/* ACTIVITY */}
        {activeTab === "activity" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </h3>

            {activities.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No recent activity
              </div>
            ) : (
              <div className="space-y-6">
                {activities.map((activity) => {
                  const userName =
                    activity.user_id === user.id
                      ? "You"
                      : activity.profiles?.full_name ||
                        activity.profiles?.email?.split("@")[0] ||
                        "Someone";

                  const userInitial = userName.charAt(0).toUpperCase();

                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border/40">
                        <span className="text-xs font-bold text-primary">
                          {userInitial}
                        </span>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">
                            {userName}
                          </span>
                          <span className="text-[11px] text-muted-foreground/60">
                            •{" "}
                            {formatDistanceToNow(
                              new Date(activity.created_at),
                              {
                                addSuffix: true,
                              }
                            )}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                          {activity.action === "added_movie" && "added "}
                          {activity.action === "removed_movie" && "removed "}
                          {activity.action === "marked_watched" && (
                            <>
                              marked{" "}
                              <span className="text-emerald-500 font-medium">
                                watched
                              </span>{" "}
                            </>
                          )}
                          {activity.action === "showed_interest" &&
                            "is interested in "}
                          {activity.action === "joined_group" &&
                            "joined the group"}
                          {activity.action === "scheduled_movie" &&
                            "scheduled "}

                          {activity.movie_title && (
                            <span className="text-primary font-medium hover:underline cursor-pointer">
                              {activity.movie_title}
                            </span>
                          )}

                          <span className="block text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-wider">
                            {new Date(activity.created_at).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
