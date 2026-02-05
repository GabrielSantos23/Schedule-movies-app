import type { Metadata } from "next";
import { getServerSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import GroupsSidebar from "@/components/groups-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <SidebarProvider>
      <GroupsSidebar user={user as any} />
      <SidebarInset className="max-h-screen overflow-hidden flex flex-col">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
