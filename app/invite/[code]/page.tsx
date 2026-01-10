import { redirect } from "next/navigation"
import { createClient } from "@/lib/server"
import InviteAccept from "@/components/invite-accept"

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const supabase = await createClient()
  const { code } = await params

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect(`/auth/login?redirect=/invite/${code}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <InviteAccept user={data.user} code={code} />
    </div>
  )
}
