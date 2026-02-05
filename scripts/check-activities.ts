import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function run() {
  try {
    console.log("Checking group_activities...");
    const res = await sql`SELECT * FROM group_activities LIMIT 5`;
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();
