import { type NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: "TMDB API key not configured" },
      { status: 500 },
    );
  }

  try {
    const detailsResponse = await fetch(
      `${TMDB_BASE_URL}/person/${id}?api_key=${TMDB_API_KEY}&language=en-US`,
    );

    if (!detailsResponse.ok) {
      throw new Error("Failed to fetch person details");
    }

    const details = await detailsResponse.json();

    const creditsResponse = await fetch(
      `${TMDB_BASE_URL}/person/${id}/combined_credits?api_key=${TMDB_API_KEY}&language=en-US`,
    );

    const credits = creditsResponse.ok
      ? await creditsResponse.json()
      : { cast: [], crew: [] };

    const imagesResponse = await fetch(
      `${TMDB_BASE_URL}/person/${id}/images?api_key=${TMDB_API_KEY}`,
    );

    const images = imagesResponse.ok
      ? await imagesResponse.json()
      : { profiles: [] };

    const externalIdsResponse = await fetch(
      `${TMDB_BASE_URL}/person/${id}/external_ids?api_key=${TMDB_API_KEY}`,
    );

    const externalIds = externalIdsResponse.ok
      ? await externalIdsResponse.json()
      : {};

    const sortedCast = (credits.cast || [])
      .filter((item: any) => item.poster_path)
      .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));

    return NextResponse.json({
      ...details,
      credits: {
        cast: sortedCast,
        crew: credits.crew || [],
      },
      images: images.profiles || [],
      external_ids: externalIds,
    });
  } catch (error) {
    console.error("Error fetching person:", error);
    return NextResponse.json(
      { error: "Failed to fetch person details" },
      { status: 500 },
    );
  }
}
