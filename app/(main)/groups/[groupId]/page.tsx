import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import GroupScheduler from "@/components/group-scheduler";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default async function GroupSchedulePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const session = await getServerSession();
  const { groupId } = await params;

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Convert Better Auth user to the expected format
  const user = {
    id: session.user.id,
    email: session.user.email,
    user_metadata: {
      full_name: session.user.name,
      avatar_url: session.user.image,
    },
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2 font-medium">Schedule App</div>
      </header>
      <div className="flex-1 p-4 pt-0 overflow-y-auto">
        <GroupScheduler user={user as any} groupId={groupId} />
      </div>
    </>
  );
}
