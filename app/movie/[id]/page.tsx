import MovieDetailsClient from "@/components/movie-details"

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <MovieDetailsClient movieId={id} />
}
