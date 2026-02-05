import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function run() {
  try {
    console.log("Fixing null dates and ids...");

    const resDate = await sql`
      UPDATE group_activities 
      SET created_at = NOW() 
      WHERE created_at IS NULL
      RETURNING id
    `;
    console.log(`Updated ${resDate.length} activities with null created_at.`);

    const resId = await sql`
      UPDATE group_activities 
      SET id = gen_random_uuid() 
      WHERE id IS NULL
      RETURNING id
    `;
    console.log(`Updated ${resId.length} activities with null id.`);
  } catch (err) {
    console.error(err);
  }
}

run();
