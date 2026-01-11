"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Film,
  Plus,
  Users,
  LogOut,
  Calendar,
  Sparkles,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  member_count?: number;
  role?: string;
}

export default function GroupsManager({ user }: { user: User }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    // Get all groups the user is a member of
    const { data: memberData, error: memberError } = await supabase
      .from("group_members")
      .select(
        "group_id, role, groups(id, name, description, created_by, created_at)"
      )
      .eq("user_id", user.id);

    if (memberError) {
      return;
    }

    // Transform the data to include role
    const groupsWithRole = memberData.map((item: any) => ({
      id: item.groups.id,
      name: item.groups.name,
      description: item.groups.description,
      created_by: item.groups.created_by,
      created_at: item.groups.created_at,
      role: item.role,
    }));

    setGroups(groupsWithRole);
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;

    setIsLoading(true);

    // Create the group
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
      setIsLoading(false);
      return;
    }

    // Add creator as owner
    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: groupData.id,
      user_id: user.id,
      role: "owner",
    });

    if (memberError) {
      setIsLoading(false);
      return;
    }

    setNewGroupName("");
    setNewGroupDescription("");
    setIsCreateDialogOpen(false);
    setIsLoading(false);
    loadGroups();
  };

  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  const updateGroup = async () => {
    if (!editingGroup || !newGroupName.trim()) return;

    setIsLoading(true);

    const { error } = await supabase
      .from("groups")
      .update({
        name: newGroupName,
        description: newGroupDescription || null,
      })
      .eq("id", editingGroup.id);

    if (error) {
      // Handle error (could add error state)
      setIsLoading(false);
      return;
    }

    setEditingGroup(null);
    setNewGroupName("");
    setNewGroupDescription("");
    setIsLoading(false);
    loadGroups();
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupToDelete.id);

    if (error) {
      // Handle error
      return;
    }

    setGroupToDelete(null);
    loadGroups();
  };

  const openEditDialog = (group: Group) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setNewGroupDescription(group.description || "");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <AlertDialog
        open={!!groupToDelete}
        onOpenChange={(open) => !open && setGroupToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              group "{groupToDelete?.name}" and remove all data associated with
              it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              onClick={updateGroup}
              disabled={isLoading || !newGroupName.trim()}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                <Film className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">
                  Movie Groups
                </h1>
                <p className="text-muted-foreground">
                  Collaborate on movie schedules with friends.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">{user.email}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-background to-muted border shadow-xl flex items-center justify-center">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <div className="absolute -right-2 -bottom-2 h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                <Plus className="h-6 w-6 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-3 text-center bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Welcome to MovieScheduler!
            </h2>
            <p className="text-muted-foreground text-center mb-10 max-w-md text-lg leading-relaxed">
              Create your first group to start scheduling movies with friends
              and family. It's time to make movie night happen!
            </p>

            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="h-12 px-8 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Create Your First Group
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
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
                    disabled={isLoading || !newGroupName.trim()}
                    className="w-full"
                  >
                    {isLoading ? (
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
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Groups</h2>
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="shadow-md">
                    <Plus className="h-4 w-4 mr-2" />
                    New Group
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
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
                      <Label htmlFor="description">
                        Description (Optional)
                      </Label>
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
                      disabled={isLoading || !newGroupName.trim()}
                      className="w-full"
                    >
                      {isLoading ? (
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

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[250px]">Group Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Role</TableHead>
                    <TableHead className="w-[120px]">Created</TableHead>
                    <TableHead className="w-[80px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow
                      key={group.id}
                      className="cursor-pointer group"
                      onClick={() => router.push(`/groups/${group.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Users className="h-4 w-4" />
                          </div>
                          <span className="font-semibold">{group.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[300px] truncate">
                        {group.description || "No description"}
                      </TableCell>
                      <TableCell>
                        {group.role === "owner" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                            Owner
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                            Member
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(group.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(group);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGroupToDelete(group);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
