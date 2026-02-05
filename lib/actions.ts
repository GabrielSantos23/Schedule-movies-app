"use server";

import { db } from "@/lib/db";
import { format } from "date-fns";

export async function getProfile(userId: string) {
  return db.profiles.getById(userId);
}

export async function upsertProfile(profile: {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
}) {
  return db.profiles.upsert(profile);
}

export async function getGroup(groupId: string) {
  return db.groups.getById(groupId);
}

export async function getGroupsByUser(userId: string) {
  return db.groups.getByUserId(userId);
}

export async function createGroup(data: {
  name: string;
  description?: string;
  created_by: string;
}) {
  return db.groups.create(data);
}

export async function updateGroup(
  groupId: string,
  data: { name?: string; description?: string },
) {
  return db.groups.update(groupId, data);
}

export async function deleteGroup(groupId: string) {
  return db.groups.delete(groupId);
}

export async function getGroupMembers(groupId: string) {
  const members = await db.groupMembers.getByGroupId(groupId);

  const membersWithProfiles = await Promise.all(
    members.map(async (member) => {
      const profile = await db.profiles.getById(member.user_id);
      return {
        ...member,
        profiles: profile,
      };
    }),
  );

  return membersWithProfiles;
}

export async function getUserMemberships(userId: string) {
  return db.groupMembers.getByUserId(userId);
}

export async function getMembership(groupId: string, userId: string) {
  return db.groupMembers.getMembership(groupId, userId);
}

export async function addGroupMember(data: {
  group_id: string;
  user_id: string;
  role?: string;
}) {
  return db.groupMembers.create(data);
}

export async function removeGroupMember(groupId: string, userId: string) {
  return db.groupMembers.delete(groupId, userId);
}

export async function getGroupSchedules(groupId: string) {
  const schedules = await db.groupSchedules.getByGroupId(groupId);

  const scheduleIds = schedules.map((s) => s.id);
  const [votes, interests] = await Promise.all([
    db.scheduleVotes.getByScheduleIds(scheduleIds),
    db.scheduleInterests.getByScheduleIds(scheduleIds),
  ]);

  return schedules.map((schedule) => ({
    ...schedule,
    schedule_votes: votes.filter((v) => v.schedule_id === schedule.id),
    schedule_interests: interests.filter((i) => i.schedule_id === schedule.id),
  }));
}

const genreMap: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

export async function createSchedule(data: {
  group_id: string;
  user_id: string;
  movie_id: number;
  movie_title: string;
  movie_poster?: string;
  movie_overview?: string;
  scheduled_date?: string;
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
  genre_ids?: number[];
}) {
  const genres =
    data.genre_ids?.map((id) => genreMap[id]).filter(Boolean) || [];
  const releaseYear = data.release_date
    ? new Date(data.release_date).getFullYear()
    : data.first_air_date
      ? new Date(data.first_air_date).getFullYear()
      : undefined;

  return db.groupSchedules.create({
    ...data,
    genres,
    release_year: releaseYear,
  });
}

export async function updateScheduleDate(
  scheduleId: string,
  date: string | null,
) {
  return db.groupSchedules.setScheduledDate(scheduleId, date);
}

export async function setScheduleWatched(scheduleId: string, watched: boolean) {
  return db.groupSchedules.setWatched(scheduleId, watched);
}

export async function markScheduleAsWatched(scheduleId: string) {
  const result = await db.groupSchedules.update(scheduleId, {
    watched: true,
    scheduled_date: null,
  });
  return result;
}

export async function deleteSchedule(scheduleId: string) {
  return db.groupSchedules.delete(scheduleId);
}

export async function getInviteByCode(code: string) {
  return db.inviteLinks.getByCode(code);
}

export async function createInviteLink(data: {
  group_id: string;
  code: string;
  created_by: string;
  expires_at?: string;
  max_uses?: number;
}) {
  return db.inviteLinks.create(data);
}

export async function incrementInviteUses(code: string) {
  return db.inviteLinks.incrementUses(code);
}

export async function toggleScheduleInterest(
  scheduleId: string,
  userId: string,
  currentVoteType: number | null,
  newVoteType: number,
) {
  if (currentVoteType === newVoteType) {
    return db.scheduleInterests.delete(scheduleId, userId);
  } else {
    return db.scheduleInterests.upsert({
      schedule_id: scheduleId,
      user_id: userId,
      vote_type: newVoteType,
    });
  }
}

export async function upsertVote(data: {
  schedule_id: string;
  user_id: string;
  vote: number;
}) {
  return db.scheduleVotes.upsert(data);
}

export async function deleteVote(scheduleId: string, userId: string) {
  return db.scheduleVotes.delete(scheduleId, userId);
}

export async function getGroupActivities(groupId: string, limit?: number) {
  const activities = await db.groupActivities.getByGroupId(groupId, limit);

  const userIds = [...new Set(activities.map((a) => a.user_id))];
  const profiles = await Promise.all(
    userIds.map((id) => db.profiles.getById(id)),
  );

  const profileMap = new Map(profiles.filter(Boolean).map((p) => [p!.id, p]));

  return activities.map((activity) => ({
    ...activity,
    profiles: profileMap.get(activity.user_id) || null,
  }));
}

export async function logActivity(data: {
  group_id: string;
  user_id: string;
  action: string;
  movie_title?: string;
}) {
  return db.groupActivities.create(data);
}
