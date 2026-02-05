"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTransitionRouter } from "next-view-transitions";

// Import server actions
import {
  getGroupsByUser,
  createGroup as createGroupAction,
  addGroupMember,
  createSchedule,
  logActivity,
} from "@/lib/actions";

interface Group {
  id: string;
  name: string;
}

interface AddToGroupButtonProps {
  media: {
    id: number;
    title: string; // or name
    overview: string;
    poster_path: string | null;
    vote_average: number;
    media_type: "movie" | "tv";
  };
}

export function AddToGroupButton({ media }: AddToGroupButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);

  // Create Group State
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Keep supabase for auth only
  const supabase = createClient();
  const router = useTransitionRouter();

  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen]);

  const loadGroups = async () => {
    setIsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const loadedGroups = await getGroupsByUser(user.id);
      setGroups(loadedGroups.map((g) => ({ id: g.id, name: g.name })));
      if (loadedGroups.length === 1) {
        setSelectedGroupId(loadedGroups[0].id);
      }
    } catch (error) {
      console.error("Error loading groups:", error);
    }
    setIsLoading(false);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setIsCreating(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // 1. Create Group
      const groupData = await createGroupAction({
        name: newGroupName,
        created_by: user.id,
      });

      // 2. Add Member
      await addGroupMember({
        group_id: groupData.id,
        user_id: user.id,
        role: "owner",
      });

      // 3. Add to local list and select it
      setGroups([...groups, { id: groupData.id, name: groupData.name }]);
      setSelectedGroupId(groupData.id);
      setNewGroupName("");
      setIsCreating(false);

      // Continue content addition automatically if it was 0 groups
      handleAddMedia(groupData.id);
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Error creating group");
      setIsCreating(false);
    }
  };

  const handleAddMedia = async (groupId: string = selectedGroupId) => {
    if (!groupId) return;
    setIsAdding(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await createSchedule({
        group_id: groupId,
        user_id: user.id,
        movie_id: media.id,
        movie_title: media.title,
        movie_overview: media.overview,
        movie_poster: media.poster_path || undefined,
        media_type: media.media_type,
      });

      // Log activity
      await logActivity({
        group_id: groupId,
        user_id: user.id,
        action: "added_movie",
        movie_title: media.title,
      });

      toast.success(`Added "${media.title}" to group.`);
      setIsOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Error adding media:", error);
      toast.error(error.message || "Error adding to group");
    }
    setIsAdding(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        size="lg"
      >
        <Plus className="h-5 w-5" />
        Add to Group
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Group</DialogTitle>
            <DialogDescription>
              Select a group to add this title to your watchlist.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : groups.length === 0 ? (
            // CREATE GROUP VIEW (No groups)
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 p-4 rounded-lg text-center text-sm text-muted-foreground mb-4">
                You don't have any groups yet. Create one to start building your
                watchlist!
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-group-name">Group Name</Label>
                <Input
                  id="new-group-name"
                  placeholder="My Watchlist"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreateGroup}
                disabled={isCreating || !newGroupName.trim()}
              >
                {isCreating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create & Add
              </Button>
            </div>
          ) : (
            // SELECT GROUP VIEW
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Group</Label>
                <Select
                  value={selectedGroupId}
                  onValueChange={setSelectedGroupId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-4">
                <Button variant="ghost" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleAddMedia(selectedGroupId)}
                  disabled={isAdding || !selectedGroupId}
                >
                  {isAdding && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add to Group
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
