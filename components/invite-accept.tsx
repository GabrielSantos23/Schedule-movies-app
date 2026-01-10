"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"

interface InviteInfo {
  group_id: string
  group_name: string
  group_description: string | null
}

export default function InviteAccept({ user, code }: { user: User; code: string }) {
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadInviteInfo()
  }, [code])

  const loadInviteInfo = async () => {
    // Get invite link and group info
    const { data: inviteData, error: inviteError } = await supabase
      .from("invite_links")
      .select("group_id, groups(id, name, description)")
      .eq("code", code)
      .single()

    if (inviteError || !inviteData) {
      setError("Invalid or expired invite link")
      setIsLoading(false)
      return
    }

    // Check if user is already a member
    const { data: memberData } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", inviteData.group_id)
      .eq("user_id", user.id)
      .single()

    if (memberData) {
      setError("You are already a member of this group")
      setIsLoading(false)
      return
    }

    setInviteInfo({
      group_id: inviteData.group_id,
      group_name: (inviteData.groups as any).name,
      group_description: (inviteData.groups as any).description,
    })
    setIsLoading(false)
  }

  const acceptInvite = async () => {
    if (!inviteInfo) return

    setIsLoading(true)

    const { error } = await supabase.from("group_members").insert({
      group_id: inviteInfo.group_id,
      user_id: user.id,
      role: "member",
    })

    if (error) {
      setError("Failed to join group")
      setIsLoading(false)
      return
    }

    // Increment invite link usage count
    const { data: inviteData } = await supabase.from("invite_links").select("uses_count").eq("code", code).single()

    if (inviteData) {
      await supabase
        .from("invite_links")
        .update({ uses_count: (inviteData.uses_count || 0) + 1 })
        .eq("code", code)
    }

    setSuccess(true)
    setIsLoading(false)

    // Redirect to group page after 2 seconds
    setTimeout(() => {
      router.push(`/groups/${inviteInfo.group_id}`)
    }, 2000)
  }

  if (isLoading && !inviteInfo) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading invite...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="max-w-md w-full border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <X className="h-6 w-6" />
              <CardTitle>Invalid Invite</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => router.push("/groups")} className="w-full">
              Go to Groups
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="max-w-md w-full border-green-500">
          <CardHeader>
            <div className="flex items-center gap-2 text-green-500">
              <Check className="h-6 w-6" />
              <CardTitle>Success!</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You've joined the group. Redirecting...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Join Group</CardTitle>
          </div>
          <CardDescription>You've been invited to join a movie group</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {inviteInfo && (
            <>
              <div className="p-4 rounded-lg bg-muted">
                <h3 className="font-semibold text-lg mb-1">{inviteInfo.group_name}</h3>
                {inviteInfo.group_description && (
                  <p className="text-sm text-muted-foreground">{inviteInfo.group_description}</p>
                )}
              </div>
              <Button onClick={acceptInvite} disabled={isLoading} className="w-full">
                {isLoading ? "Joining..." : "Accept Invite"}
              </Button>
              <Button variant="outline" onClick={() => router.push("/groups")} className="w-full">
                Decline
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
