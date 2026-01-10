import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import GroupsLayout from "@/components/groups-layout";

export default async function GroupsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return <GroupsLayout user={data.user} />;
}
