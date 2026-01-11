import { type NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const type = searchParams.get("type") || "multi"; // movie, tv, or multi
  const page = searchParams.get("page") || "1";

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: "TMDB API key not configured" },
      { status: 500 }
    );
  }

  try {
    const searchType =
      type === "multi" ? "multi" : type === "tv" ? "tv" : "movie";
    const response = await fetch(
      `${TMDB_BASE_URL}/search/${searchType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
        query
      )}&include_adult=false&language=en-US&page=${page}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from TMDB");
    }

    const data = await response.json();

    // For multi search, add media_type if not present
    if (searchType === "multi" && data.results) {
      data.results = data.results.filter(
        (item: any) =>
          item.media_type === "movie" ||
          item.media_type === "tv" ||
          item.media_type === "person"
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
