import { NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "movie"; // movie, tv
  const page = searchParams.get("page") || "1";

  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: "TMDB API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Determine the endpoint based on type
    let endpoint = "";
    if (type === "tv") {
      endpoint = `${TMDB_BASE_URL}/trending/tv/week`;
    } else {
      endpoint = `${TMDB_BASE_URL}/trending/movie/week`;
    }

    const response = await fetch(
      `${endpoint}?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from TMDB");
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch trending data" },
      { status: 500 }
    );
  }
}
