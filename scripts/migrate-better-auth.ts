import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function runMigration() {
  console.log("Running Better Auth migration...");

  // Read the migration file
  const migrationPath = path.join(
    __dirname,
    "../better-auth_migrations/2026-02-04T20-47-44.107Z.sql",
  );
  const migrationSql = fs.readFileSync(migrationPath, "utf-8");

  // Split by statements and run each
  const statements = migrationSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const client = await pool.connect();

  try {
    for (const statement of statements) {
      try {
        console.log(`Running: ${statement.substring(0, 60)}...`);
        await client.query(statement);
        console.log("✓ Success");
      } catch (error: any) {
        if (error.message?.includes("already exists")) {
          console.log("✓ Already exists, skipping");
        } else {
          console.error("Error:", error.message);
        }
      }
    }

    console.log("\n✅ Better Auth migration complete!");
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
