"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GroupActivity, Member } from "./types";
import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";

interface ActivityFeedProps {
  activities: GroupActivity[];
  currentUserId: string;
  members: Member[];
}

export function ActivityFeed({
  activities,
  currentUserId,
  members,
}: ActivityFeedProps) {
  const getUserName = (
    userId: string,
    profile?: { email: string; full_name?: string }
  ) => {
    if (userId === currentUserId) return "You";
    if (profile?.full_name) return profile.full_name;
    const member = members.find((m) => m.user_id === userId);
    if (member?.profiles?.full_name) return member.profiles.full_name;

    const email = profile?.email || member?.profiles?.email;
    if (email) {
      const prefix = email.split("@")[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }

    return "Member";
  };

  // Helper para formatar o texto com estilo de "link" para as entidades
  const renderActionContent = (activity: GroupActivity) => {
    const movieLink = (
      <span className="text-primary hover:underline cursor-pointer font-medium">
        {activity.movie_title}
      </span>
    );

    const groupLink = (
      <span className="text-primary hover:underline cursor-pointer font-medium">
        group details
      </span>
    );

    switch (activity.action) {
      case "added_movie":
        return <>added {movieLink} to the watchlist</>;
      case "removed_movie":
        return <>removed {movieLink} from the schedule</>;
      case "marked_watched":
        return (
          <>
            marked {movieLink} as{" "}
            <span className="text-emerald-500 font-medium">watched</span>
          </>
        );
      case "showed_interest":
        return <>is interested in {movieLink}</>;
      case "scheduled_movie":
        return <>scheduled {movieLink}</>;
      case "joined_group":
        return "joined the group";
      case "updated_group":
        return <>updated the {groupLink}</>;
      case "removed_date":
        return <>removed the scheduled date for {movieLink}</>;
      default:
        return "performed an action";
    }
  };

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <Activity className="h-10 w-10 mb-2 opacity-20" />
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {activities.map((activity) => {
        const member = members.find((m) => m.user_id === activity.user_id);
        const avatarUrl = member?.profiles?.avatar_url;
        const userName = getUserName(activity.user_id, activity.profiles);

        return (
          <div key={activity.id} className="flex gap-3 items-start group">
            {/* Avatar Minimalista */}
            <div className="shrink-0">
              <Avatar className="h-8 w-8 border-none bg-secondary/50">
                {avatarUrl && <AvatarImage src={avatarUrl} />}
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                  {userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Texto da Atividade */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground/90">
                  {userName}
                </span>
                <span className="text-xs text-muted-foreground/60">
                  •{" "}
                  {formatDistanceToNow(new Date(activity.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              <div className="text-sm text-muted-foreground leading-snug">
                {renderActionContent(activity)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
