-- Migration: Add genres and release_year to group_schedules
-- Run this in your Supabase SQL Editor

ALTER TABLE group_schedules 
ADD COLUMN IF NOT EXISTS genres JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS release_year INTEGER;

-- Optional: Update existing records if needed (requires more complex logic or manual update)
