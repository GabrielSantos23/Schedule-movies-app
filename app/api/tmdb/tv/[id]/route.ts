import { type NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const season = searchParams.get("season");

  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: "TMDB API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Fetch TV show details with credits, videos, and similar shows
    const [tvRes, creditsRes, videosRes, similarRes, providersRes] =
      await Promise.all([
        fetch(
          `${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}&language=en-US`
        ),
        fetch(
          `${TMDB_BASE_URL}/tv/${id}/credits?api_key=${TMDB_API_KEY}&language=en-US`
        ),
        fetch(
          `${TMDB_BASE_URL}/tv/${id}/videos?api_key=${TMDB_API_KEY}&language=en-US`
        ),
        fetch(
          `${TMDB_BASE_URL}/tv/${id}/similar?api_key=${TMDB_API_KEY}&language=en-US&page=1`
        ),
        fetch(
          `${TMDB_BASE_URL}/tv/${id}/watch/providers?api_key=${TMDB_API_KEY}`
        ),
      ]);

    if (!tvRes.ok) {
      throw new Error("Failed to fetch TV show details");
    }

    const tv = await tvRes.json();
    const credits = await creditsRes.json();
    const videos = await videosRes.json();
    const similar = await similarRes.json();
    const providers = await providersRes.json();

    // Fetch season details if a specific season is requested
    let seasonDetails = null;
    const seasonNumber = season ? parseInt(season, 10) : 1;

    if (tv.seasons && tv.seasons.length > 0) {
      const seasonRes = await fetch(
        `${TMDB_BASE_URL}/tv/${id}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=en-US`
      );
      if (seasonRes.ok) {
        seasonDetails = await seasonRes.json();
      }
    }

    // Get trailer (prefer official trailers)
    const trailer =
      videos.results?.find(
        (v: any) => v.type === "Trailer" && v.site === "YouTube"
      ) || videos.results?.[0];

    return NextResponse.json({
      ...tv,
      credits: {
        cast: credits.cast?.slice(0, 10) || [],
        crew:
          credits.crew
            ?.filter(
              (c: any) =>
                c.job === "Director" ||
                c.job === "Executive Producer" ||
                c.job === "Creator" ||
                c.department === "Writing"
            )
            .slice(0, 5) || [],
      },
      trailer: trailer
        ? {
            key: trailer.key,
            name: trailer.name,
            site: trailer.site,
          }
        : null,
      similar: similar.results?.slice(0, 8) || [],
      currentSeason: seasonDetails,
      providers: providers.results || null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch TV show details" },
      { status: 500 }
    );
  }
}
