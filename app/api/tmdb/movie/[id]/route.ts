import { type NextRequest, NextResponse } from "next/server"

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: "TMDB API key not configured" }, { status: 500 })
  }

  try {
    // Fetch movie details with credits, videos, recommendations, and similar movies
    const [movieRes, creditsRes, videosRes, similarRes] = await Promise.all([
      fetch(`${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&language=en-US`),
      fetch(`${TMDB_BASE_URL}/movie/${id}/credits?api_key=${TMDB_API_KEY}&language=en-US`),
      fetch(`${TMDB_BASE_URL}/movie/${id}/videos?api_key=${TMDB_API_KEY}&language=en-US`),
      fetch(`${TMDB_BASE_URL}/movie/${id}/similar?api_key=${TMDB_API_KEY}&language=en-US&page=1`),
    ])

    if (!movieRes.ok) {
      throw new Error("Failed to fetch movie details")
    }

    const movie = await movieRes.json()
    const credits = await creditsRes.json()
    const videos = await videosRes.json()
    const similar = await similarRes.json()

    // Get trailer (prefer official trailers)
    const trailer = videos.results?.find(
      (v: any) => v.type === "Trailer" && v.site === "YouTube"
    ) || videos.results?.[0]

    return NextResponse.json({
      ...movie,
      credits: {
        cast: credits.cast?.slice(0, 10) || [],
        crew: credits.crew?.filter((c: any) => 
          c.job === "Director" || c.job === "Producer" || c.job === "Screenplay" || c.job === "Writer"
        ).slice(0, 5) || [],
      },
      trailer: trailer ? {
        key: trailer.key,
        name: trailer.name,
        site: trailer.site,
      } : null,
      similar: similar.results?.slice(0, 8) || [],
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch movie details" }, { status: 500 })
  }
}
