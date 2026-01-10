"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Film, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  role?: string;
}

interface GroupsSidebarProps {
  user: User;
  currentGroupId?: string;
}

export default function GroupsSidebar({
  user,
  currentGroupId,
}: GroupsSidebarProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit state
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Delete state
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setIsLoading(true);
    const { data: memberData, error: memberError } = await supabase
      .from("group_members")
      .select(
        "group_id, role, groups(id, name, description, created_by, created_at)"
      )
      .eq("user_id", user.id);

    if (memberError) {
      setIsLoading(false);
      return;
    }

    const groupsWithRole = memberData.map((item: any) => ({
      id: item.groups.id,
      name: item.groups.name,
      description: item.groups.description,
      created_by: item.groups.created_by,
      created_at: item.groups.created_at,
      role: item.role,
    }));

    setGroups(groupsWithRole);
    setIsLoading(false);
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;

    setIsCreating(true);

    const { data: groupData, error: groupError } = await supabase
      .from("groups")
      .insert({
        name: newGroupName,
        description: newGroupDescription || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (groupError) {
      setIsCreating(false);
      return;
    }

    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: groupData.id,
      user_id: user.id,
      role: "owner",
    });

    if (memberError) {
      setIsCreating(false);
      return;
    }

    setNewGroupName("");
    setNewGroupDescription("");
    setIsCreateDialogOpen(false);
    setIsCreating(false);
    loadGroups();

    window.location.href = `/groups/${groupData.id}`;
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setEditName(group.name);
    setEditDescription(group.description || "");
  };

  const saveEditGroup = async () => {
    if (!editingGroup || !editName.trim()) return;

    setIsEditing(true);

    const { error } = await supabase
      .from("groups")
      .update({
        name: editName,
        description: editDescription || null,
      })
      .eq("id", editingGroup.id);

    if (error) {
      setIsEditing(false);
      return;
    }

    setEditingGroup(null);
    setIsEditing(false);
    loadGroups();
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    setIsDeleting(true);

    // First delete all group members
    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupToDelete.id);

    // Then delete all schedules
    await supabase
      .from("group_schedules")
      .delete()
      .eq("group_id", groupToDelete.id);

    // Then delete the group
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupToDelete.id);

    if (error) {
      setIsDeleting(false);
      setGroupToDelete(null);
      return;
    }

    setGroupToDelete(null);
    setIsDeleting(false);

    // If we deleted the current group, redirect to first available group
    if (currentGroupId === groupToDelete.id) {
      const remainingGroups = groups.filter((g) => g.id !== groupToDelete.id);
      if (remainingGroups.length > 0) {
        window.location.href = `/groups/${remainingGroups[0].id}`;
      } else {
        window.location.href = "/groups";
      }
    } else {
      loadGroups();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getGroupColor = (name: string) => {
    const colors = [
      "from-violet-500 to-purple-600",
      "from-blue-500 to-cyan-600",
      "from-emerald-500 to-teal-600",
      "from-orange-500 to-amber-600",
      "from-pink-500 to-rose-600",
      "from-indigo-500 to-blue-600",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Shared group button component with context menu
  const GroupButton = ({ group }: { group: Group }) => {
    const isActive = currentGroupId === group.id;
    const isOwner = group.role === "owner";

    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <Link
            href={`/groups/${group.id}`}
            className={`relative h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl flex items-center justify-center font-semibold text-xs md:text-sm transition-all hover:scale-105 flex-shrink-0 ${
              isActive
                ? "bg-transparent border-2 border-violet-500 text-violet-500 shadow-lg shadow-violet-500/20"
                : "bg-muted hover:bg-muted/80 text-foreground border border-border/50"
            }`}
          >
            {getInitials(group.name)}
          </Link>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem
            onClick={() => handleEditGroup(group)}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit Group
          </ContextMenuItem>
          {isOwner && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => setGroupToDelete(group)}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete Group
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  // Create button shared component - only the trigger button
  const CreateButton = () => (
    <button
      onClick={() => setIsCreateDialogOpen(true)}
      className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl border-2 border-dashed border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all hover:scale-105 flex-shrink-0"
    >
      <Plus className="h-5 w-5 md:h-6 md:w-6" />
    </button>
  );

  return (
    <>
      {/* Create Group Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Group Name</Label>
              <Input
                id="create-name"
                placeholder="Family Movie Night"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">Description (Optional)</Label>
              <Textarea
                id="create-description"
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

      {/* Edit Group Dialog */}
      <Dialog
        open={!!editingGroup}
        onOpenChange={(open) => !open && setEditingGroup(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Group Name</Label>
              <Input
                id="edit-name"
                placeholder="Group name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Group description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingGroup(null)}>
                Cancel
              </Button>
              <Button
                onClick={saveEditGroup}
                disabled={isEditing || !editName.trim()}
              >
                {isEditing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Group Alert Dialog */}
      <AlertDialog
        open={!!groupToDelete}
        onOpenChange={(open) => !open && setGroupToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{groupToDelete?.name}" and all its
              movie schedules. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Desktop Sidebar - hidden on mobile */}
      <TooltipProvider delayDuration={100}>
        <div className="hidden md:flex fixed left-0 top-0 h-full w-[72px] bg-muted/30 border-r border-border/50 flex-col items-center py-4 z-40">
          {/* Logo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 mb-2 flex-shrink-0">
                <Film className="h-6 w-6" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              <p>MovieScheduler</p>
            </TooltipContent>
          </Tooltip>

          {/* Divider */}
          <div className="w-8 h-[2px] bg-border/50 rounded-full mb-2 flex-shrink-0" />

          {/* Groups List */}
          <div className="flex-1 min-h-0 flex flex-col items-center gap-2 overflow-y-auto scrollbar-hide w-full px-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              groups.map((group) => (
                <Tooltip key={group.id}>
                  <TooltipTrigger asChild>
                    <div>
                      <GroupButton group={group} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    <p className="font-medium">{group.name}</p>
                    {group.description && (
                      <p className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {group.description}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              ))
            )}
          </div>

          {/* Divider */}
          <div className="w-8 h-[2px] bg-border/50 rounded-full my-2 flex-shrink-0" />

          {/* Create Button */}
          <div className="flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <CreateButton />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                <p>Create New Group</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>

      {/* Mobile Header - shown only on mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-xl border-b border-border/50 flex items-center px-4 gap-3 z-40">
        {/* Logo */}
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 flex-shrink-0">
          <Film className="h-5 w-5" />
        </div>

        {/* Divider */}
        <div className="w-[2px] h-8 bg-border/50 rounded-full flex-shrink-0" />

        {/* Groups List - horizontal scroll */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            groups.map((group) => <GroupButton key={group.id} group={group} />)
          )}
        </div>

        {/* Create Button */}
        <CreateButton />
      </div>
    </>
  );
}
