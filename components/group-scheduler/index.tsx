"use client";

import { useState, useEffect } from "react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { User } from "@supabase/supabase-js";
import {
  CalendarIcon,
  Film,
  Search,
  Copy,
  Check,
  Users,
  Plus,
  Loader2,
  Star,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Filter,
  Settings,
  MoreVertical,
  UserPlus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

import {
  Movie,
  GroupSchedule,
  Group,
  Member,
  GroupActivity,
  parseLocalDate,
} from "./types";

import {
  getGroup,
  getGroupMembers,
  getGroupSchedules,
  getGroupActivities,
  createSchedule,
  deleteSchedule,
  updateScheduleDate,
  createInviteLink,
  toggleScheduleInterest,
  logActivity,
  setScheduleWatched,
} from "@/lib/actions";

export default function GroupScheduler({
  user,
  groupId,
}: {
  user: User;
  groupId: string;
}) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isAddMovieOpen, setIsAddMovieOpen] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [schedules, setSchedules] = useState<GroupSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("20:00");
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<GroupSchedule | null>(
    null,
  );
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editTime, setEditTime] = useState("20:00");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [addingMovieId, setAddingMovieId] = useState<number | null>(null);
  const [processingScheduleId, setProcessingScheduleId] = useState<
    string | null
  >(null);
  const [processingAction, setProcessingAction] = useState<
    "vote_up" | "vote_down" | "delete" | "watch" | null
  >(null);

  const [activities, setActivities] = useState<GroupActivity[]>([]);

  const [filterMode, setFilterMode] = useState<"all" | "watched" | "unwatched">(
    "unwatched",
  );
  const [sortBy, setSortBy] = useState<"date" | "rating" | "votes">("date");
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    loadGroup();
    loadMembers();
    loadSchedules();
    loadActivities();
  }, [groupId]);

  let filteredSchedules = [...schedules];

  const scheduledFuture = schedules
    .filter(
      (s) =>
        s.scheduled_date &&
        !s.watched &&
        !isPast(parseLocalDate(s.scheduled_date)),
    )
    .sort(
      (a, b) =>
        parseLocalDate(a.scheduled_date!).getTime() -
        parseLocalDate(b.scheduled_date!).getTime(),
    );

  const nextSession = scheduledFuture[0];

  useEffect(() => {
    if (!nextSession?.scheduled_date) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0 });
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date(nextSession.scheduled_date!);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft({ days, hours, minutes });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, [nextSession]);

  filteredSchedules = filteredSchedules.filter((s) => s.id !== nextSession?.id);

  const loadGroup = async () => {
    const data = await getGroup(groupId);
    if (data) setGroup(data as any);
  };

  const loadMembers = async () => {
    const membersWithProfiles = await getGroupMembers(groupId);
    setMembers(membersWithProfiles as any);
  };

  const loadSchedules = async () => {
    const data = await getGroupSchedules(groupId);
    setSchedules((data as any) || []);
  };

  const loadActivities = async () => {
    const data = await getGroupActivities(groupId, 50);
    console.log("Activity Data:", data);
    if (data) setActivities(data as any);
  };

  const logActivityAction = async (
    action: GroupActivity["action"],
    movieTitle?: string,
  ) => {
    await logActivity({
      group_id: groupId,
      user_id: user.id,
      action,
      movie_title: movieTitle,
    });
    loadActivities();
  };

  const getMemberName = (userId: string) => {
    const member = members.find((m) => m.user_id === userId);
    return (
      member?.profiles?.full_name ||
      member?.profiles?.email?.split("@")[0] ||
      "Unknown Member"
    );
  };

  const getMemberAvatar = (userId: string) => {
    const member = members.find((m) => m.user_id === userId);
    return member?.profiles?.avatar_url;
  };

  const searchMovies = async (page: number = 1) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/tmdb/search?query=${encodeURIComponent(searchQuery)}&page=${page}`,
      );
      const data = await response.json();
      if (page === 1) {
        setMovies(data.results || []);
        setCurrentPage(1);
      } else {
        setMovies((prev) => [...prev, ...(data.results || [])]);
      }
      setHasMoreResults(data.page < data.total_pages);
    } catch (err) {
      console.error("Failed search");
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleMovie = async (movie: Movie) => {
    setAddingMovieId(movie.id);
    try {
      let scheduledDateISO = undefined;

      if (selectedDate) {
        const dateTime = new Date(selectedDate);
        const [hours, minutes] = selectedTime.split(":").map(Number);
        dateTime.setHours(hours, minutes);
        scheduledDateISO = dateTime.toISOString();
      }

      await createSchedule({
        group_id: groupId,
        user_id: user.id,
        movie_id: movie.id,
        movie_title: movie.title || movie.name || "",
        movie_poster: movie.poster_path || undefined,
        movie_overview: movie.overview || undefined,
        scheduled_date: scheduledDateISO,
        media_type: movie.media_type || "movie",
        release_date: movie.release_date || undefined,
        first_air_date: movie.first_air_date || undefined,
        genre_ids: movie.genre_ids,
      });
      logActivityAction("added_movie", movie.title || movie.name);
      loadSchedules();
      setSelectedDate(undefined);
      setSelectedTime("20:00");
    } catch (error) {
      console.error("Error scheduling movie:", error);
    } finally {
      setAddingMovieId(null);
    }
  };

  const removeSchedule = async (id: string, movieTitle?: string) => {
    setProcessingScheduleId(id);
    setProcessingAction("delete");
    try {
      await deleteSchedule(id);
      if (movieTitle) logActivityAction("removed_movie", movieTitle);
      loadSchedules();
    } finally {
      setProcessingScheduleId(null);
      setProcessingAction(null);
    }
  };

  const toggleWatched = async (schedule: GroupSchedule) => {
    setProcessingScheduleId(schedule.id);
    setProcessingAction("watch");
    try {
      await setScheduleWatched(schedule.id, !schedule.watched);
      loadSchedules();
    } finally {
      setProcessingScheduleId(null);
      setProcessingAction(null);
    }
  };

  const handleUpdateScheduleDate = async () => {
    if (!editingSchedule || !editDate) return;

    setIsSavingEdit(true);
    try {
      const dateTime = new Date(editDate);
      const [hours, minutes] = editTime.split(":").map(Number);
      dateTime.setHours(hours, minutes);

      await updateScheduleDate(editingSchedule.id, dateTime.toISOString());
      logActivityAction("scheduled_movie", editingSchedule.movie_title);
      loadSchedules();
      setIsEditScheduleOpen(false);
      setEditingSchedule(null);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const openEditSchedule = (schedule: GroupSchedule) => {
    setEditingSchedule(schedule);
    setEditDate(
      schedule.scheduled_date ? new Date(schedule.scheduled_date) : undefined,
    );
    setEditTime(
      schedule.scheduled_date
        ? format(new Date(schedule.scheduled_date), "HH:mm")
        : "20:00",
    );
    setIsEditScheduleOpen(true);
  };

  const padZero = (num: number) => num.toString().padStart(2, "0");

  const generateInviteLink = async () => {
    setIsGeneratingInvite(true);
    try {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      await createInviteLink({ group_id: groupId, code, created_by: user.id });
      setInviteLink(`${window.location.origin}/invite/${code}`);
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVote = async (scheduleId: string, voteType: number) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (!schedule) return;

    setProcessingScheduleId(scheduleId);
    setProcessingAction(voteType === 1 ? "vote_up" : "vote_down");

    try {
      const interests = schedule.schedule_interests || [];
      const myInterest = interests.find((i) => i.user_id === user.id);
      const currentVote = myInterest?.vote_type || null;

      await toggleScheduleInterest(scheduleId, user.id, currentVote, voteType);

      if (currentVote !== voteType) {
        if (voteType === 1)
          logActivityAction("showed_interest", schedule.movie_title);
      }

      loadSchedules();
    } finally {
      setProcessingScheduleId(null);
      setProcessingAction(null);
    }
  };

  filteredSchedules = filteredSchedules.filter((s) => s.id !== nextSession?.id);

  if (filterMode === "unwatched") {
    filteredSchedules = filteredSchedules.filter((s) => !s.watched);
  } else if (filterMode === "watched") {
    filteredSchedules = filteredSchedules.filter((s) => s.watched);
  }

  if (sortBy === "votes") {
    filteredSchedules.sort((a, b) => {
      const getScore = (s: GroupSchedule) => {
        const up =
          s.schedule_interests?.filter((i) => i.vote_type === 1).length || 0;
        const down =
          s.schedule_interests?.filter((i) => i.vote_type === -1).length || 0;
        return up - down;
      };
      return getScore(b) - getScore(a);
    });
  } else if (sortBy === "rating") {
    filteredSchedules.sort(
      (a, b) => (b.vote_average || 0) - (a.vote_average || 0),
    );
  } else {
    filteredSchedules.sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime(),
    );
  }

  const getVoteCounts = (s: GroupSchedule) => {
    const up =
      s.schedule_interests?.filter((i) => i.vote_type === 1).length || 0;
    const down =
      s.schedule_interests?.filter((i) => i.vote_type === -1).length || 0;
    const myVote =
      s.schedule_interests?.find((i) => i.user_id === user.id)?.vote_type ||
      null;
    return { up, down, myVote };
  };

  return (
    <div className="min-h-screen bg-background">
      <Dialog open={isAddMovieOpen} onOpenChange={setIsAddMovieOpen}>
        <DialogContent className="sm:max-w-[700px] h-[70vh] flex flex-col p-0 gap-0 overflow-hidden">
          <div className="p-6 pb-4 border-b">
            <DialogHeader>
              <DialogTitle>Add to Group Watchlist</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search movies & TV shows..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchMovies()}
                />
              </div>

              <Button onClick={() => searchMovies()} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Search"}
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1 p-6">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {movies.map((movie) => {
                const isAdded = schedules.some((s) => s.movie_id === movie.id);
                return (
                  <div key={movie.id} className="group relative">
                    <div className="aspect-[2/3] rounded-lg bg-muted overflow-hidden relative">
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Film className="opacity-20" />
                        </div>
                      )}
                      {isAdded && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white font-medium flex items-center gap-1">
                            <Check className="h-4 w-4" /> Added
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!isAdded && (
                          <>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className={
                                    selectedDate
                                      ? "border-primary text-primary"
                                      : ""
                                  }
                                >
                                  <CalendarIcon className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-4"
                                align="center"
                              >
                                <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={setSelectedDate}
                                  initialFocus
                                />
                                <div className="mt-4 border-t pt-4">
                                  <Label className="text-xs mb-2 block text-muted-foreground">
                                    Time (Optional)
                                  </Label>
                                  <Input
                                    type="time"
                                    value={selectedTime}
                                    onChange={(e) =>
                                      setSelectedTime(e.target.value)
                                    }
                                    className="w-full"
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                            <Button
                              size="sm"
                              disabled={addingMovieId === movie.id}
                              onClick={() => {
                                scheduleMovie(movie);
                              }}
                            >
                              {addingMovieId === movie.id ? (
                                <>
                                  <Spinner className="mr-2 h-4 w-4 text-white" />
                                  Adding
                                </>
                              ) : (
                                "Add"
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-xs mt-2 font-medium line-clamp-1">
                      {movie.title || movie.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Members</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 py-4">
            <Input
              value={inviteLink || ""}
              readOnly
              placeholder="Generate link first..."
            />
            <Button
              onClick={!inviteLink ? generateInviteLink : copyInviteLink}
              variant="outline"
              disabled={isGeneratingInvite}
            >
              {!inviteLink ? (
                isGeneratingInvite ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  "Generate"
                )
              ) : copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditScheduleOpen} onOpenChange={setIsEditScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={!editDate ? "text-muted-foreground" : ""}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editDate ? (
                      format(editDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editDate}
                    onSelect={setEditDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditScheduleOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateScheduleDate}
              disabled={isSavingEdit}
              className="min-w-[100px]"
            >
              {isSavingEdit ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 text-white" />
                  Saving
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-border/40">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {group?.name}
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl text-lg">
              {group?.description || "No description provided."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" /> Settings
            </Button>
            <Button
              className="gap-2"
              onClick={() => setIsInviteDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4" /> Invite Members
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-10">
            {nextSession && (
              <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 shadow-2xl">
                <div className="absolute inset-0">
                  {nextSession.movie_poster && (
                    <img
                      src={`https://image.tmdb.org/t/p/original${nextSession.movie_poster}`}
                      className="w-full h-full object-cover opacity-20 blur-xl scale-110"
                    />
                  )}
                </div>

                <div className="relative p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center md:items-start z-10">
                  <div className="absolute top-4 right-4 md:top-6 md:right-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingSchedule(nextSession);
                            setEditDate(
                              nextSession.scheduled_date
                                ? new Date(nextSession.scheduled_date)
                                : undefined,
                            );
                            setEditTime(
                              nextSession.scheduled_date
                                ? format(
                                    new Date(nextSession.scheduled_date),
                                    "HH:mm",
                                  )
                                : "20:00",
                            );
                            setIsEditScheduleOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Edit Schedule
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-500"
                          disabled={
                            processingScheduleId === nextSession.id &&
                            processingAction === "delete"
                          }
                          onClick={() =>
                            removeSchedule(
                              nextSession.id,
                              nextSession.movie_title,
                            )
                          }
                        >
                          {processingScheduleId === nextSession.id &&
                          processingAction === "delete" ? (
                            <Spinner className="mr-2 h-4 w-4" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}{" "}
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="shrink-0 aspect-[2/3] w-40 rounded-xl overflow-hidden shadow-2xl rotate-2 border-2 border-white/10">
                    <img
                      src={`https://image.tmdb.org/t/p/w500${nextSession.movie_poster}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-6 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
                      <CalendarIcon className="h-3 w-3" /> Next Session
                    </div>
                    <div>
                      <h2 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight mb-2">
                        {nextSession.movie_title}
                      </h2>
                      <div className="flex items-center justify-center md:justify-start gap-4 text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />{" "}
                          {nextSession.scheduled_date
                            ? format(
                                parseLocalDate(nextSession.scheduled_date),
                                "EEEE, MMM d • h:mm a",
                              )
                            : "Time TBD"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 max-w-md mx-auto md:mx-0">
                      <div className="bg-background/40 backdrop-blur rounded-lg p-3 border border-white/5 text-center">
                        <div className="text-2xl font-bold">
                          {padZero(timeLeft.days)}
                        </div>
                        <div className="text-[10px] uppercase text-muted-foreground font-medium">
                          Days
                        </div>
                      </div>
                      <div className="bg-background/40 backdrop-blur rounded-lg p-3 border border-white/5 text-center">
                        <div className="text-2xl font-bold">
                          {padZero(timeLeft.hours)}
                        </div>
                        <div className="text-[10px] uppercase text-muted-foreground font-medium">
                          Hrs
                        </div>
                      </div>
                      <div className="bg-background/40 backdrop-blur rounded-lg p-3 border border-white/5 text-center">
                        <div className="text-2xl font-bold">
                          {padZero(timeLeft.minutes)}
                        </div>
                        <div className="text-[10px] uppercase text-muted-foreground font-medium">
                          Min
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20 py-2">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  Group Watchlist
                  <Badge variant="secondary" className="rounded-full">
                    {filteredSchedules.length}
                  </Badge>
                </h3>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-56 p-2">
                      <div className="space-y-2">
                        <h4 className="font-medium text-xs text-muted-foreground px-2 mb-1">
                          Display
                        </h4>
                        <div className="grid grid-cols-2 gap-1 mb-2">
                          <Button
                            variant={
                              viewMode === "list" ? "secondary" : "ghost"
                            }
                            size="sm"
                            onClick={() => setViewMode("list")}
                          >
                            List
                          </Button>
                          <Button
                            variant={
                              viewMode === "grid" ? "secondary" : "ghost"
                            }
                            size="sm"
                            onClick={() => setViewMode("grid")}
                          >
                            Grid
                          </Button>
                        </div>
                        <div className="h-px bg-border my-1" />
                        <h4 className="font-medium text-xs text-muted-foreground px-2 mb-1">
                          View
                        </h4>
                        <div className="grid gap-1">
                          {["all", "unwatched", "watched"].map((m) => (
                            <Button
                              key={m}
                              variant={filterMode === m ? "secondary" : "ghost"}
                              size="sm"
                              className="justify-start capitalize h-8"
                              onClick={() => setFilterMode(m as any)}
                            >
                              {m}
                            </Button>
                          ))}
                        </div>
                        <div className="h-px bg-border my-1" />
                        <h4 className="font-medium text-xs text-muted-foreground px-2 mb-1">
                          Sort By
                        </h4>
                        <div className="grid gap-1">
                          <Button
                            variant={sortBy === "date" ? "secondary" : "ghost"}
                            size="sm"
                            className="justify-start h-8"
                            onClick={() => setSortBy("date")}
                          >
                            Date Added
                          </Button>
                          <Button
                            variant={sortBy === "votes" ? "secondary" : "ghost"}
                            size="sm"
                            className="justify-start h-8"
                            onClick={() => setSortBy("votes")}
                          >
                            Votes
                          </Button>
                          <Button
                            variant={
                              sortBy === "rating" ? "secondary" : "ghost"
                            }
                            size="sm"
                            className="justify-start h-8"
                            onClick={() => setSortBy("rating")}
                          >
                            Rating
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    onClick={() => setIsAddMovieOpen(true)}
                    className="gap-1.5 h-9"
                  >
                    <Plus className="h-4 w-4" /> Add Movie
                  </Button>
                </div>
              </div>

              <div
                className={
                  viewMode === "list"
                    ? "space-y-4"
                    : "grid grid-cols-2 sm:grid-cols-3 gap-4"
                }
              >
                {filteredSchedules.length === 0 ? (
                  <div
                    className={`text-center py-12 border border-dashed rounded-xl border-muted-foreground/20 ${viewMode === "grid" ? "col-span-full" : ""}`}
                  >
                    <Film className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">
                      No movies found in this list.
                    </p>
                  </div>
                ) : (
                  filteredSchedules.map((schedule) => {
                    const { up, down, myVote } = getVoteCounts(schedule);

                    if (viewMode === "grid") {
                      return (
                        <div
                          key={schedule.id}
                          className="group relative rounded-xl bg-card border border-border/40 overflow-hidden hover:border-border transition-all hover:shadow-lg"
                        >
                          <Link
                            href={`/${schedule.media_type === "tv" ? "series" : "movie"}/${schedule.movie_id}`}
                          >
                            <div className="aspect-[2/3] bg-muted relative cursor-pointer">
                              {schedule.movie_poster ? (
                                <img
                                  src={`https://image.tmdb.org/t/p/w342${schedule.movie_poster}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Film className="opacity-20" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-3 flex flex-col justify-end">
                                <h4 className="font-bold text-white text-sm line-clamp-2 leading-tight">
                                  {schedule.movie_title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-white/80">
                                  <span>
                                    {schedule.release_year ||
                                      (schedule.release_date
                                        ? new Date(
                                            schedule.release_date,
                                          ).getFullYear()
                                        : "N/A")}
                                  </span>
                                  {schedule.vote_average && (
                                    <span className="flex items-center gap-0.5 text-amber-400">
                                      <Star className="h-2.5 w-2.5 fill-current" />{" "}
                                      {schedule.vote_average.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                          <div className="p-2 flex items-center justify-between bg-card text-xs">
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className={`h-6 w-6 ${myVote === 1 ? "text-primary" : ""}`}
                                onClick={() => handleVote(schedule.id, 1)}
                                disabled={
                                  processingScheduleId === schedule.id &&
                                  processingAction === "vote_up"
                                }
                              >
                                {processingScheduleId === schedule.id &&
                                processingAction === "vote_up" ? (
                                  <Spinner className="h-3 w-3" />
                                ) : (
                                  <ThumbsUp className="h-3 w-3" />
                                )}
                              </Button>
                              <span>{up - down}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className={`h-6 w-6 ${myVote === -1 ? "text-red-500" : ""}`}
                                onClick={() => handleVote(schedule.id, -1)}
                                disabled={
                                  processingScheduleId === schedule.id &&
                                  processingAction === "vote_down"
                                }
                              >
                                {processingScheduleId === schedule.id &&
                                processingAction === "vote_down" ? (
                                  <Spinner className="h-3 w-3" />
                                ) : (
                                  <ThumbsDown className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => toggleWatched(schedule)}
                                  disabled={
                                    processingScheduleId === schedule.id &&
                                    processingAction === "watch"
                                  }
                                >
                                  {processingScheduleId === schedule.id &&
                                  processingAction === "watch" ? (
                                    <Spinner className="mr-2 h-4 w-4" />
                                  ) : schedule.watched ? (
                                    <>
                                      <EyeOff className="mr-2 h-4 w-4" />{" "}
                                      Unwatch
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="mr-2 h-4 w-4" /> Watched
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openEditSchedule(schedule)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20"
                                  disabled={
                                    processingScheduleId === schedule.id &&
                                    processingAction === "delete"
                                  }
                                  onClick={() =>
                                    removeSchedule(
                                      schedule.id,
                                      schedule.movie_title,
                                    )
                                  }
                                >
                                  {processingScheduleId === schedule.id &&
                                  processingAction === "delete" ? (
                                    <Spinner className="mr-2 h-4 w-4" />
                                  ) : (
                                    <Trash2 className="mr-2 h-4 w-4" />
                                  )}{" "}
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={schedule.id}
                        className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-card border border-border/40 hover:border-border transition-colors hover:shadow-sm"
                      >
                        <div className="shrink-0 aspect-[2/3] w-24 sm:w-20 rounded-lg overflow-hidden bg-muted shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                          <Link
                            href={`/${schedule.media_type === "tv" ? "series" : "movie"}/${schedule.movie_id}`}
                          >
                            {schedule.movie_poster && (
                              <img
                                src={`https://image.tmdb.org/t/p/w200${schedule.movie_poster}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </Link>
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <Link
                                  href={`/${schedule.media_type === "tv" ? "series" : "movie"}/${schedule.movie_id}`}
                                >
                                  <h4 className="text-lg font-bold leading-tight line-clamp-1 hover:text-primary transition-colors cursor-pointer">
                                    {schedule.movie_title}
                                  </h4>
                                </Link>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                                  <span>
                                    {schedule.release_year ||
                                      (schedule.release_date
                                        ? new Date(
                                            schedule.release_date,
                                          ).getFullYear()
                                        : schedule.first_air_date
                                          ? new Date(
                                              schedule.first_air_date,
                                            ).getFullYear()
                                          : "N/A")}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {schedule.media_type === "tv"
                                      ? "TV Series"
                                      : "Movie"}
                                  </span>
                                  {schedule.vote_average && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1 text-amber-400">
                                        <Star className="h-3 w-3 fill-current" />{" "}
                                        {schedule.vote_average.toFixed(1)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => toggleWatched(schedule)}
                                    disabled={
                                      processingScheduleId === schedule.id &&
                                      processingAction === "watch"
                                    }
                                  >
                                    {processingScheduleId === schedule.id &&
                                    processingAction === "watch" ? (
                                      <Spinner className="mr-2 h-4 w-4" />
                                    ) : schedule.watched ? (
                                      <>
                                        <EyeOff className="mr-2 h-4 w-4" />{" "}
                                        Unwatch
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="mr-2 h-4 w-4" /> Watched
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openEditSchedule(schedule)}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20"
                                    disabled={
                                      processingScheduleId === schedule.id &&
                                      processingAction === "delete"
                                    }
                                    onClick={() =>
                                      removeSchedule(
                                        schedule.id,
                                        schedule.movie_title,
                                      )
                                    }
                                  >
                                    {processingScheduleId === schedule.id &&
                                    processingAction === "delete" ? (
                                      <Spinner className="mr-2 h-4 w-4" />
                                    ) : (
                                      <Trash2 className="mr-2 h-4 w-4" />
                                    )}{" "}
                                    Remove
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-2 mt-3">
                              <Avatar className="h-5 w-5 border border-background">
                                <AvatarImage
                                  src={getMemberAvatar(schedule.user_id)}
                                />
                                <AvatarFallback className="text-[9px]">
                                  {getMemberName(schedule.user_id).charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">
                                Added by{" "}
                                <span className="font-medium text-foreground">
                                  {getMemberName(schedule.user_id)}
                                </span>
                              </span>
                            </div>

                            {schedule.genres && schedule.genres.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {schedule.genres.slice(0, 3).map((g) => (
                                  <Badge
                                    key={g}
                                    variant="secondary"
                                    className="rounded-md px-2 py-0.5 text-[10px] font-normal text-muted-foreground bg-muted/50"
                                  >
                                    {g}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 pt-2 border-t border-border/30 mt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={
                                processingScheduleId === schedule.id &&
                                processingAction === "vote_up"
                              }
                              className={`h-8 gap-1.5 rounded-full ${myVote === 1 ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary" : "text-muted-foreground"}`}
                              onClick={() => handleVote(schedule.id, 1)}
                            >
                              {processingScheduleId === schedule.id &&
                              processingAction === "vote_up" ? (
                                <Spinner className="h-4 w-4" />
                              ) : (
                                <ThumbsUp
                                  className={`h-4 w-4 ${myVote === 1 ? "fill-current" : ""}`}
                                />
                              )}
                              <span className="font-semibold">{up}</span>
                            </Button>
                            <div className="w-px h-4 bg-border mx-1" />
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={
                                processingScheduleId === schedule.id &&
                                processingAction === "vote_down"
                              }
                              className={`h-8 gap-1.5 rounded-full ${myVote === -1 ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-500" : "text-muted-foreground"}`}
                              onClick={() => handleVote(schedule.id, -1)}
                            >
                              {processingScheduleId === schedule.id &&
                              processingAction === "vote_down" ? (
                                <Spinner className="h-4 w-4" />
                              ) : (
                                <ThumbsDown
                                  className={`h-4 w-4 ${myVote === -1 ? "fill-current" : ""}`}
                                />
                              )}
                              <span className="font-semibold">{down}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-xl border border-border/50 bg-card flex flex-col h-[400px] overflow-hidden">
              <div className="p-4 border-b border-border/50 flex items-center justify-between shrink-0">
                <h3 className="font-semibold">Group Activity</h3>
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  View All
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  {activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent activity.
                    </p>
                  ) : (
                    activities.map((activity) => {
                      const isMe = activity.user_id === user.id;
                      const name = isMe
                        ? "You"
                        : activity.profiles?.full_name || "Member";

                      return (
                        <div key={activity.id} className="flex gap-3 relative">
                          <div className="absolute left-[15px] top-8 bottom-[-24px] w-px bg-border/50 last:hidden" />
                          <Avatar className="h-8 w-8 shrink-0 z-10 border-2 border-background">
                            {activity.profiles?.avatar_url ? (
                              <AvatarImage src={activity.profiles.avatar_url} />
                            ) : (
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {name.charAt(0)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="space-y-1">
                            <p className="text-sm leading-snug">
                              <span className="font-semibold">{name}</span>{" "}
                              <span className="text-muted-foreground">
                                {activity.action === "added_movie" && "added"}
                                {activity.action === "showed_interest" &&
                                  "voted for"}
                                {activity.action === "removed_movie" &&
                                  "removed"}
                                {activity.action === "scheduled_movie" &&
                                  "scheduled"}
                              </span>{" "}
                              <span className="font-medium text-primary">
                                {activity.movie_title || "a movie"}
                              </span>
                              {activity.action === "added_movie" && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  to the watchlist.
                                </span>
                              )}
                              {activity.action === "showed_interest" && (
                                <span className="text-muted-foreground">.</span>
                              )}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {activity.created_at
                                ? formatDistanceToNow(
                                    new Date(activity.created_at),
                                    { addSuffix: true },
                                  )
                                : "Just now"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
              <div className="p-4 border-b border-border/50">
                <h3 className="font-semibold">Members ({members.length})</h3>
              </div>
              <div className="p-2 grid grid-cols-4 gap-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col items-center gap-1 p-2 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
                    title={member.profiles?.full_name || "Member"}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profiles?.avatar_url} />
                      <AvatarFallback>
                        {(member.profiles?.full_name || "?").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                ))}
                <button
                  onClick={() => setIsInviteDialogOpen(true)}
                  className="flex flex-col items-center justify-center gap-1 p-2 hover:bg-muted/50 rounded-lg transition-colors h-full min-h-[56px] text-muted-foreground hover:text-primary border border-dashed border-border"
                >
                  <span className="text-xs font-medium">+ Invite</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
