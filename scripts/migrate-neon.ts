/**
 * Script to run Neon database migrations
 * Run with: bun run scripts/migrate-neon.ts
 */

import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  console.log("🚀 Connecting to Neon database...");
  const sql = neon(databaseUrl);

  try {
    console.log("📝 Running schema migration...\n");

    await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
    console.log("  ✅ Enabled pgcrypto extension");

    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY,
        email TEXT,
        full_name TEXT,
        avatar_url TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log("  ✅ Created profiles table");

    await sql`
      CREATE TABLE IF NOT EXISTS groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        created_by UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log("  ✅ Created groups table");

    await sql`
      CREATE TABLE IF NOT EXISTS group_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(group_id, user_id)
      )
    `;
    console.log("  ✅ Created group_members table");

    await sql`
      CREATE TABLE IF NOT EXISTS group_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        movie_id INTEGER NOT NULL,
        movie_title TEXT NOT NULL,
        movie_poster TEXT,
        movie_overview TEXT,
        scheduled_date DATE,
        release_date DATE,
        first_air_date DATE,
        media_type TEXT DEFAULT 'movie',
        watched BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log("  ✅ Created group_schedules table");

    await sql`
      CREATE TABLE IF NOT EXISTS invite_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        code TEXT NOT NULL UNIQUE,
        created_by UUID NOT NULL,
        expires_at TIMESTAMPTZ,
        max_uses INTEGER,
        uses_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log("  ✅ Created invite_links table");

    await sql`
      CREATE TABLE IF NOT EXISTS schedule_interests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        schedule_id UUID NOT NULL REFERENCES group_schedules(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        interested BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(schedule_id, user_id)
      )
    `;
    console.log("  ✅ Created schedule_interests table");

    await sql`
      CREATE TABLE IF NOT EXISTS group_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        action TEXT NOT NULL CHECK (action IN ('added_movie', 'removed_movie', 'marked_watched', 'showed_interest', 'joined_group', 'scheduled_movie', 'updated_group', 'removed_date')),
        movie_title TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log("  ✅ Created group_activities table");

    await sql`
      CREATE TABLE IF NOT EXISTS schedule_votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        schedule_id UUID NOT NULL REFERENCES group_schedules(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        vote INTEGER NOT NULL CHECK (vote IN (-1, 1)),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(schedule_id, user_id)
      )
    `;
    console.log("  ✅ Created schedule_votes table");

    console.log("\n📊 Creating indexes...");

    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_group_schedules_group_id ON group_schedules(group_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_group_schedules_group_date ON group_schedules(group_id, scheduled_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invite_links_code ON invite_links(code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_schedule_interests_schedule_id ON schedule_interests(schedule_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_schedule_interests_user_id ON schedule_interests(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_group_activities_group_id ON group_activities(group_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_group_activities_created_at ON group_activities(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_schedule_votes_schedule_id ON schedule_votes(schedule_id)`;

    console.log("  ✅ All indexes created");

    console.log("\n📋 Verifying tables...");
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    console.log("Tables in database:");
    tables.forEach((t: any) => console.log(`  📦 ${t.table_name}`));

    console.log("\n✅ Migration completed successfully!");
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message || error);
    process.exit(1);
  }
}

migrate();
