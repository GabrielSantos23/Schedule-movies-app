import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import GroupsHomeClient from "@/components/groups-home-client";

export default async function GroupsPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = {
    id: session.user.id,
    email: session.user.email,
    user_metadata: {
      full_name: session.user.name,
      avatar_url: session.user.image,
    },
  };

  return <GroupsHomeClient user={user as any} />;
}
