import SeriesDetailsClient from "@/components/series-details";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="w-px h-4 bg-border/50 mx-2" />
        <div className="flex items-center gap-2 font-medium">
          Series Details
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        <SeriesDetailsClient seriesId={id} />
      </div>
    </>
  );
}
