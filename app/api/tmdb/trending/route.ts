import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET() {
  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: "TMDB API key not configured" },
      { status: 500 }
    );
  }

  try {
    const [movieRes, tvRes] = await Promise.all([
      fetch(
        `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&language=en-US`
      ),
      fetch(
        `${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}&language=en-US`
      ),
    ]);

    if (!movieRes.ok || !tvRes.ok) {
      throw new Error("Failed to fetch from TMDB");
    }

    const [movieData, tvData] = await Promise.all([
      movieRes.json(),
      tvRes.json(),
    ]);

    return NextResponse.json({
      movies: movieData.results,
      tv: tvData.results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch trending data" },
      { status: 500 }
    );
  }
}
