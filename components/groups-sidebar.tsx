"use client";

import { useState, useEffect } from "react";
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
import { Link, useTransitionRouter } from "next-view-transitions";
import { useRouter, usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SearchOverlay } from "@/components/search-overlay";
import { Search } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  getGroupsByUser,
  getUserMemberships,
  createGroup as createGroupAction,
  updateGroup as updateGroupAction,
  deleteGroup as deleteGroupAction,
  addGroupMember,
} from "@/lib/actions";

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
  initialSearchOpen?: boolean;
  initialSearchQuery?: string;
}

export default function GroupsSidebar({
  user,
  currentGroupId,
  initialSearchOpen,
  initialSearchQuery,
}: GroupsSidebarProps) {
  const pathname = usePathname();
  // Derive selected group ID from prop OR pathname
  const derivedGroupId =
    currentGroupId ||
    (pathname?.startsWith("/groups/") ? pathname.split("/")[2] : undefined);

  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(initialSearchOpen || false);

  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useTransitionRouter();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const memberships = await getUserMemberships(user.id);

      const groupsData = await getGroupsByUser(user.id);

      const groupsWithRole = groupsData.map((group) => {
        const membership = memberships.find((m) => m.group_id === group.id);
        return {
          ...group,
          role: membership?.role || "member",
        };
      });

      setGroups(groupsWithRole as Group[]);
    } catch (error) {
      console.error("Error loading groups:", error);
    }
    setIsLoading(false);
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
      loadGroups();

      window.location.href = `/groups/${groupData.id}`;
    } catch (error) {
      console.error("Error creating group:", error);
      setIsCreating(false);
    }
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setEditName(group.name);
    setEditDescription(group.description || "");
  };

  const saveEditGroup = async () => {
    if (!editingGroup || !editName.trim()) return;

    setIsEditing(true);

    try {
      await updateGroupAction(editingGroup.id, {
        name: editName,
        description: editDescription || undefined,
      });

      setEditingGroup(null);
      setIsEditing(false);
      loadGroups();
    } catch (error) {
      console.error("Error updating group:", error);
      setIsEditing(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    setIsDeleting(true);

    try {
      await deleteGroupAction(groupToDelete.id);

      setGroupToDelete(null);
      setIsDeleting(false);

      if (derivedGroupId === groupToDelete.id) {
        const remainingGroups = groups.filter((g) => g.id !== groupToDelete.id);
        if (remainingGroups.length > 0) {
          window.location.href = `/groups/${remainingGroups[0].id}`;
        } else {
          window.location.href = "/groups";
        }
      } else {
        loadGroups();
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      setIsDeleting(false);
      setGroupToDelete(null);
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

  const GroupButton = ({ group }: { group: Group }) => {
    const isActive = derivedGroupId === group.id;
    const isOwner = group.role === "owner";

    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <Link
            href={`/groups/${group.id}`}
            className={`relative h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl flex items-center justify-center font-semibold text-xs md:text-sm transition-all hover:scale-105 flex-shrink-0 ${
              isActive
                ? "bg-transparent border-2 border-border text-primary shadow-lg shadow-violet-500/20"
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
                maxLength={50}
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
                maxLength={100}
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
                maxLength={50}
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
                maxLength={100}
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

      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/explore">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Film className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Netflux</span>
                    <span className="truncate text-xs">Groups</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Search"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Your Groups</SidebarGroupLabel>
            <SidebarMenu>
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin h-4 w-4" />
                </div>
              ) : (
                groups.map((group) => (
                  <SidebarMenuItem key={group.id}>
                    <ContextMenu>
                      <ContextMenuTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          tooltip={group.name}
                          isActive={derivedGroupId === group.id}
                        >
                          <a href={`/groups/${group.id}`}>
                            <span className="flex items-center justify-center font-bold text-xs bg-muted text-muted-foreground w-6 h-6 rounded mr-1">
                              {getInitials(group.name)}
                            </span>
                            <span className="truncate font-medium">
                              {group.name}
                            </span>
                          </a>
                        </SidebarMenuButton>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-48">
                        <ContextMenuItem
                          onClick={() => handleEditGroup(group)}
                          className="gap-2"
                        >
                          <Pencil className="h-4 w-4" /> Edit Group
                        </ContextMenuItem>
                        {group.role === "owner" && (
                          <>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              onClick={() => setGroupToDelete(group)}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" /> Delete Group
                            </ContextMenuItem>
                          </>
                        )}
                      </ContextMenuContent>
                    </ContextMenu>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup className="mt-auto">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Create Group"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus />
                  <span>Create Group</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>{/* User profile could go here */}</SidebarFooter>
      </Sidebar>

      {isSearchOpen && (
        <SearchOverlay
          onClose={() => setIsSearchOpen(false)}
          defaultValue={initialSearchQuery}
        />
      )}
    </>
  );
}
