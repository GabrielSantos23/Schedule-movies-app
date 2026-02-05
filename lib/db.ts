import { neon, NeonQueryFunction } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export { sql };

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
}

export interface GroupSchedule {
  id: string;
  group_id: string;
  user_id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  movie_overview: string | null;
  scheduled_date: string | null;
  release_date: string | null;
  first_air_date: string | null;
  media_type: string;
  watched: boolean;
  created_at: string;
  genres?: string[];
  release_year?: number;
}

export interface InviteLink {
  id: string;
  group_id: string;
  code: string;
  created_by: string;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  created_at: string;
}

export interface ScheduleInterest {
  id: string;
  schedule_id: string;
  user_id: string;
  vote_type: number;
  created_at: string;
  updated_at: string;
}

export interface GroupActivity {
  id: string;
  group_id: string;
  user_id: string;
  action: string;
  movie_title: string | null;
  created_at: string;
}

export interface ScheduleVote {
  id: string;
  schedule_id: string;
  user_id: string;
  vote: number;
  created_at: string;
}

export const db = {
  profiles: {
    async getById(id: string): Promise<Profile | null> {
      const result = await sql`SELECT * FROM profiles WHERE id = ${id}`;
      return (result[0] as Profile) || null;
    },
    async getByEmail(email: string): Promise<Profile | null> {
      const result = await sql`SELECT * FROM profiles WHERE email = ${email}`;
      return (result[0] as Profile) || null;
    },
    async upsert(profile: {
      id: string;
      email?: string;
      full_name?: string;
      avatar_url?: string;
    }): Promise<Profile> {
      const result = await sql`
        INSERT INTO profiles (id, email, full_name, avatar_url, updated_at)
        VALUES (${profile.id}, ${profile.email || null}, ${profile.full_name || null}, ${profile.avatar_url || null}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          email = COALESCE(${profile.email || null}, profiles.email),
          full_name = COALESCE(${profile.full_name || null}, profiles.full_name),
          avatar_url = COALESCE(${profile.avatar_url || null}, profiles.avatar_url),
          updated_at = NOW()
        RETURNING *
      `;
      return result[0] as Profile;
    },
  },

  groups: {
    async getById(id: string): Promise<Group | null> {
      const result = await sql`SELECT * FROM groups WHERE id = ${id}`;
      return (result[0] as Group) || null;
    },
    async getByUserId(userId: string): Promise<Group[]> {
      const result = await sql`
        SELECT g.* FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = ${userId}
        ORDER BY g.created_at DESC
      `;
      return result as Group[];
    },
    async create(group: {
      name: string;
      description?: string;
      created_by: string;
    }): Promise<Group> {
      const result = await sql`
        INSERT INTO groups (name, description, created_by)
        VALUES (${group.name}, ${group.description || null}, ${group.created_by})
        RETURNING *
      `;
      return result[0] as Group;
    },
    async update(
      id: string,
      data: { name?: string; description?: string },
    ): Promise<Group> {
      const result = await sql`
        UPDATE groups
        SET name = COALESCE(${data.name || null}, name),
            description = COALESCE(${data.description || null}, description)
        WHERE id = ${id}
        RETURNING *
      `;
      return result[0] as Group;
    },
    async delete(id: string): Promise<void> {
      await sql`DELETE FROM groups WHERE id = ${id}`;
    },
  },

  groupMembers: {
    async getByGroupId(groupId: string): Promise<GroupMember[]> {
      const result =
        await sql`SELECT * FROM group_members WHERE group_id = ${groupId}`;
      return result as GroupMember[];
    },
    async getByUserId(userId: string): Promise<GroupMember[]> {
      const result =
        await sql`SELECT * FROM group_members WHERE user_id = ${userId}`;
      return result as GroupMember[];
    },
    async getMembership(
      groupId: string,
      userId: string,
    ): Promise<GroupMember | null> {
      const result = await sql`
        SELECT * FROM group_members 
        WHERE group_id = ${groupId} AND user_id = ${userId}
      `;
      return (result[0] as GroupMember) || null;
    },
    async create(member: {
      group_id: string;
      user_id: string;
      role?: string;
    }): Promise<GroupMember> {
      const result = await sql`
        INSERT INTO group_members (group_id, user_id, role)
        VALUES (${member.group_id}, ${member.user_id}, ${member.role || "member"})
        RETURNING *
      `;
      return result[0] as GroupMember;
    },
    async updateRole(
      groupId: string,
      userId: string,
      role: string,
    ): Promise<GroupMember> {
      const result = await sql`
        UPDATE group_members
        SET role = ${role}
        WHERE group_id = ${groupId} AND user_id = ${userId}
        RETURNING *
      `;
      return result[0] as GroupMember;
    },
    async delete(groupId: string, userId: string): Promise<void> {
      await sql`DELETE FROM group_members WHERE group_id = ${groupId} AND user_id = ${userId}`;
    },
  },

  groupSchedules: {
    async getByGroupId(groupId: string): Promise<GroupSchedule[]> {
      const result = await sql`
        SELECT * FROM group_schedules 
        WHERE group_id = ${groupId}
        ORDER BY scheduled_date ASC NULLS LAST, created_at DESC
      `;
      return result as GroupSchedule[];
    },
    async getById(id: string): Promise<GroupSchedule | null> {
      const result = await sql`SELECT * FROM group_schedules WHERE id = ${id}`;
      return (result[0] as GroupSchedule) || null;
    },
    async create(schedule: {
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
      genres?: string[];
      release_year?: number;
    }): Promise<GroupSchedule> {
      const result = await sql`
        INSERT INTO group_schedules (group_id, user_id, movie_id, movie_title, movie_poster, movie_overview, scheduled_date, release_date, first_air_date, media_type, genres, release_year)
        VALUES (
          ${schedule.group_id}, 
          ${schedule.user_id}, 
          ${schedule.movie_id}, 
          ${schedule.movie_title}, 
          ${schedule.movie_poster || null}, 
          ${schedule.movie_overview || null}, 
          ${schedule.scheduled_date || null}, 
          ${schedule.release_date || null}, 
          ${schedule.first_air_date || null}, 
          ${schedule.media_type || "movie"},
          ${JSON.stringify(schedule.genres || [])},
          ${schedule.release_year || null}
        )
        RETURNING *
      `;
      return result[0] as GroupSchedule;
    },
    async update(
      id: string,
      data: { scheduled_date?: string | null; watched?: boolean },
    ): Promise<GroupSchedule> {
      if (data.scheduled_date === null) {
        const result = await sql`
          UPDATE group_schedules
          SET scheduled_date = NULL,
              watched = COALESCE(${data.watched ?? null}, watched)
          WHERE id = ${id}
          RETURNING *
        `;
        return result[0] as GroupSchedule;
      }
      const result = await sql`
        UPDATE group_schedules
        SET scheduled_date = COALESCE(${data.scheduled_date ?? null}, scheduled_date),
            watched = COALESCE(${data.watched ?? null}, watched)
        WHERE id = ${id}
        RETURNING *
      `;
      return result[0] as GroupSchedule;
    },
    async setWatched(id: string, watched: boolean): Promise<GroupSchedule> {
      const result = await sql`
        UPDATE group_schedules
        SET watched = ${watched}
        WHERE id = ${id}
        RETURNING *
      `;
      return result[0] as GroupSchedule;
    },
    async setScheduledDate(
      id: string,
      date: string | null,
    ): Promise<GroupSchedule> {
      const result = await sql`
        UPDATE group_schedules
        SET scheduled_date = ${date}
        WHERE id = ${id}
        RETURNING *
      `;
      return result[0] as GroupSchedule;
    },
    async delete(id: string): Promise<void> {
      await sql`DELETE FROM group_schedules WHERE id = ${id}`;
    },
  },

  inviteLinks: {
    async getByGroupId(groupId: string): Promise<InviteLink[]> {
      const result =
        await sql`SELECT * FROM invite_links WHERE group_id = ${groupId}`;
      return result as InviteLink[];
    },
    async getByCode(code: string): Promise<InviteLink | null> {
      const result = await sql`SELECT * FROM invite_links WHERE code = ${code}`;
      return (result[0] as InviteLink) || null;
    },
    async create(link: {
      group_id: string;
      code: string;
      created_by: string;
      expires_at?: string;
      max_uses?: number;
    }): Promise<InviteLink> {
      const result = await sql`
        INSERT INTO invite_links (group_id, code, created_by, expires_at, max_uses)
        VALUES (${link.group_id}, ${link.code}, ${link.created_by}, ${link.expires_at || null}, ${link.max_uses || null})
        RETURNING *
      `;
      return result[0] as InviteLink;
    },
    async incrementUses(code: string): Promise<void> {
      await sql`UPDATE invite_links SET uses_count = uses_count + 1 WHERE code = ${code}`;
    },
    async delete(id: string): Promise<void> {
      await sql`DELETE FROM invite_links WHERE id = ${id}`;
    },
  },

  scheduleInterests: {
    async getByScheduleId(scheduleId: string): Promise<ScheduleInterest[]> {
      const result =
        await sql`SELECT * FROM schedule_interests WHERE schedule_id = ${scheduleId}`;
      return result as ScheduleInterest[];
    },
    async getByScheduleIds(scheduleIds: string[]): Promise<ScheduleInterest[]> {
      if (scheduleIds.length === 0) return [];
      const result =
        await sql`SELECT * FROM schedule_interests WHERE schedule_id = ANY(${scheduleIds})`;
      return result as ScheduleInterest[];
    },
    async upsert(interest: {
      schedule_id: string;
      user_id: string;
      vote_type: number;
    }): Promise<ScheduleInterest> {
      const result = await sql`
        INSERT INTO schedule_interests (schedule_id, user_id, vote_type, updated_at)
        VALUES (${interest.schedule_id}, ${interest.user_id}, ${interest.vote_type}, NOW())
        ON CONFLICT (schedule_id, user_id) DO UPDATE SET
          vote_type = ${interest.vote_type},
          updated_at = NOW()
        RETURNING *
      `;
      return result[0] as ScheduleInterest;
    },
    async delete(scheduleId: string, userId: string): Promise<void> {
      await sql`DELETE FROM schedule_interests WHERE schedule_id = ${scheduleId} AND user_id = ${userId}`;
    },
  },

  groupActivities: {
    async getByGroupId(groupId: string, limit = 50): Promise<GroupActivity[]> {
      const result = await sql`
        SELECT * FROM group_activities 
        WHERE group_id = ${groupId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return result as GroupActivity[];
    },
    async create(activity: {
      group_id: string;
      user_id: string;
      action: string;
      movie_title?: string;
    }): Promise<GroupActivity> {
      const result = await sql`
        INSERT INTO group_activities (group_id, user_id, action, movie_title)
        VALUES (${activity.group_id}, ${activity.user_id}, ${activity.action}, ${activity.movie_title || null})
        RETURNING *
      `;
      return result[0] as GroupActivity;
    },
  },

  scheduleVotes: {
    async getByScheduleId(scheduleId: string): Promise<ScheduleVote[]> {
      const result =
        await sql`SELECT * FROM schedule_votes WHERE schedule_id = ${scheduleId}`;
      return result as ScheduleVote[];
    },
    async getByScheduleIds(scheduleIds: string[]): Promise<ScheduleVote[]> {
      if (scheduleIds.length === 0) return [];
      const result =
        await sql`SELECT * FROM schedule_votes WHERE schedule_id = ANY(${scheduleIds})`;
      return result as ScheduleVote[];
    },
    async upsert(vote: {
      schedule_id: string;
      user_id: string;
      vote: number;
    }): Promise<ScheduleVote> {
      const result = await sql`
        INSERT INTO schedule_votes (schedule_id, user_id, vote)
        VALUES (${vote.schedule_id}, ${vote.user_id}, ${vote.vote})
        ON CONFLICT (schedule_id, user_id) DO UPDATE SET vote = ${vote.vote}
        RETURNING *
      `;
      return result[0] as ScheduleVote;
    },
    async delete(scheduleId: string, userId: string): Promise<void> {
      await sql`DELETE FROM schedule_votes WHERE schedule_id = ${scheduleId} AND user_id = ${userId}`;
    },
  },
};
