import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // You'll need this
const TMDB_API_KEY = process.env.TMDB_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function backfillReleaseDates() {
  console.log("Starting backfill of release dates...");

  const { data: schedules, error } = await supabase
    .from("group_schedules")
    .select("id, movie_id, media_type")
    .or("release_date.is.null,first_air_date.is.null");

  if (error) {
    console.error("Error fetching schedules:", error);
    return;
  }

  console.log(`Found ${schedules?.length || 0} schedules to update`);

  for (const schedule of schedules || []) {
    try {
      const mediaType = schedule.media_type === "tv" ? "tv" : "movie";
      const response = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${schedule.movie_id}?api_key=${TMDB_API_KEY}`,
      );

      if (!response.ok) {
        console.error(
          `Failed to fetch data for ${mediaType} ${schedule.movie_id}`,
        );
        continue;
      }

      const data = await response.json();

      const updateData: any = {};
      if (data.release_date) {
        updateData.release_date = data.release_date;
      }
      if (data.first_air_date) {
        updateData.first_air_date = data.first_air_date;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from("group_schedules")
          .update(updateData)
          .eq("id", schedule.id);

        if (updateError) {
          console.error(`Error updating schedule ${schedule.id}:`, updateError);
        } else {
          console.log(`✓ Updated schedule ${schedule.id}`);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    } catch (err) {
      console.error(`Error processing schedule ${schedule.id}:`, err);
    }
  }

  console.log("Backfill complete!");
}

backfillReleaseDates().catch(console.error);
