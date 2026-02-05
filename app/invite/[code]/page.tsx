import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import InviteAccept from "@/components/invite-accept";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const session = await getServerSession();
  const { code } = await params;

  if (!session?.user) {
    redirect(`/auth/login?redirect=/invite/${code}`);
  }

  // Convert Better Auth user to expected format
  const user = {
    id: session.user.id,
    email: session.user.email,
    user_metadata: {
      full_name: session.user.name,
      avatar_url: session.user.image,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <InviteAccept user={user as any} code={code} />
    </div>
  );
}
