"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import GroupsSidebar from "@/components/groups-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Film, Loader2, Sparkles, Users } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import GroupScheduler from "./group-scheduler";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

import {
  getGroupsByUser,
  createGroup as createGroupAction,
  addGroupMember,
} from "@/lib/actions";

interface Group {
  id: string;
  name: string;
  description: string | null;
}

interface GroupsLayoutProps {
  user: User;
  groupId?: string;
}

export default function GroupsLayout({ user, groupId }: GroupsLayoutProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (groupId && groups.length > 0) {
      const group = groups.find((g) => g.id === groupId);
      setSelectedGroup(group || null);
    }
  }, [groupId, groups]);

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const groupsData = await getGroupsByUser(user.id);

      const groupsList = groupsData.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
      }));

      setGroups(groupsList);
      setIsLoading(false);

      if (!groupId && groupsList.length > 0) {
        window.location.href = `/groups/${groupsList[0].id}`;
        return;
      }

      if (groupId) {
        const group = groupsList.find((g: Group) => g.id === groupId);
        setSelectedGroup(group || null);
      }
    } catch (error) {
      console.error("Error loading groups:", error);
      setIsLoading(false);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;

    setIsCreating(true);

    try {
      const groupData = await createGroupAction({
        name: newGroupName,
        description: newGroupDescription || undefined,
        created_by: user.id,
      });

      await addGroupMember({
        group_id: groupData.id,
        user_id: user.id,
        role: "owner",
      });

      setNewGroupName("");
      setNewGroupDescription("");
      setIsCreateDialogOpen(false);
      setIsCreating(false);

      window.location.href = `/groups/${groupData.id}`;
    } catch (error) {
      console.error("Error creating group:", error);
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your groups...</p>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="container mx-auto px-4 flex flex-col items-center justify-center min-h-screen">
          <div className="max-w-md text-center space-y-8">
            <div className="relative mx-auto w-fit">
              <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full" />
              <div className="relative h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/30">
                <Film className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold">
                Welcome to MovieScheduler
              </h1>
              <p className="text-muted-foreground text-lg">
                Create your first group to start scheduling movie nights with
                friends and family.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="space-y-2">
                <div className="h-12 w-12 mx-auto rounded-xl bg-muted flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Invite Friends</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 w-12 mx-auto rounded-xl bg-muted flex items-center justify-center">
                  <Film className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Add Movies</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 w-12 mx-auto rounded-xl bg-muted flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Vote Together</p>
              </div>
            </div>

            <Button
              size="lg"
              className="gap-2 px-8"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Sparkles className="h-5 w-5" />
              Create Your First Group
            </Button>
          </div>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Your First Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  placeholder="Family Movie Night"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="A group for scheduling family movie nights"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={createGroup}
                disabled={isCreating || !newGroupName.trim()}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Group"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <GroupsSidebar user={user} currentGroupId={groupId} />
      <SidebarInset className="max-h-screen overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2 font-medium">
            Schedule App
          </div>
        </header>
        <div className="flex-1 p-4 pt-0 max-h-[calc(100vh-5rem)] overflow-y-auto">
          {groupId && selectedGroup ? (
            <GroupScheduler user={user} groupId={groupId} />
          ) : (
            <div className="min-h-[80vh] flex flex-col items-center justify-center">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-muted flex items-center justify-center">
                  <Film className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold">Select a Group</h2>
                <p className="text-muted-foreground max-w-md">
                  Choose a group from the sidebar to view and manage your movie
                  schedules.
                </p>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
