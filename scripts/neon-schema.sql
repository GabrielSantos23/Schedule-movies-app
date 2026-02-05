-- Neon Database Schema for Schedule App
-- This schema matches Better Auth's TEXT IDs for user identification

-- Enable UUID extension for table primary keys
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table (synced from Better Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY, -- Changed from UUID to TEXT
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT NOT NULL, -- Changed from UUID to TEXT
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Changed from UUID to TEXT
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create group_schedules table
CREATE TABLE IF NOT EXISTS group_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Changed from UUID to TEXT
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
);

-- Create invite_links table
CREATE TABLE IF NOT EXISTS invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by TEXT NOT NULL, -- Changed from UUID to TEXT
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create schedule_interests table
CREATE TABLE IF NOT EXISTS schedule_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES group_schedules(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Changed from UUID to TEXT
  interested BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(schedule_id, user_id)
);

-- Create group_activities table
CREATE TABLE IF NOT EXISTS group_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Changed from UUID to TEXT
  action TEXT NOT NULL,
  movie_title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create schedule_votes table
CREATE TABLE IF NOT EXISTS schedule_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES group_schedules(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Changed from UUID to TEXT
  vote INTEGER NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(schedule_id, user_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_schedules_group_id ON group_schedules(group_id);
CREATE INDEX IF NOT EXISTS idx_group_schedules_group_date ON group_schedules(group_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_invite_links_code ON invite_links(code);
CREATE INDEX IF NOT EXISTS idx_schedule_interests_schedule_id ON schedule_interests(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_interests_user_id ON schedule_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_group_activities_group_id ON group_activities(group_id);
CREATE INDEX IF NOT EXISTS idx_group_activities_created_at ON group_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedule_votes_schedule_id ON schedule_votes(schedule_id);
