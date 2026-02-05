import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function run() {
  try {
    console.log("Fixing null dates and ids...");

    // Fix created_at
    const resDate = await sql`
      UPDATE group_activities 
      SET created_at = NOW() 
      WHERE created_at IS NULL
      RETURNING id
    `;
    console.log(`Updated ${resDate.length} activities with null created_at.`);

    // Fix id if null (using gen_random_uuid if available, or just uuid_generate_v4, or client side generation if needed)
    // Neon usually supports gen_random_uuid().
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
