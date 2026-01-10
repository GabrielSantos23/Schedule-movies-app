import SeriesDetailsClient from "@/components/series-details";

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SeriesDetailsClient seriesId={id} />;
}
