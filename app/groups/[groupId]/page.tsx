import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import GroupsLayout from "@/components/groups-layout";

export default async function GroupSchedulePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const supabase = await createClient();
  const { groupId } = await params;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return <GroupsLayout user={data.user} groupId={groupId} />;
}
