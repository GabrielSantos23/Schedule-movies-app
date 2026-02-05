import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_YCgD8fIGr2oe@ep-sparkling-glitter-aiu1owsk-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function run() {
  try {
    console.log("Running migration: Alter scheduled_date type...");
    await sql`
      ALTER TABLE group_schedules
      ALTER COLUMN scheduled_date TYPE TIMESTAMP WITH TIME ZONE
      USING scheduled_date::TIMESTAMP WITH TIME ZONE;
    `;
    console.log("Done.");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

run();
