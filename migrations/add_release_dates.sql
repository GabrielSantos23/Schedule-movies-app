-- Migration: Add release_date and first_air_date to group_schedules
-- Run this in your Supabase SQL Editor

-- Add the new columns
ALTER TABLE group_schedules
ADD COLUMN IF NOT EXISTS release_date DATE,
ADD COLUMN IF NOT EXISTS first_air_date DATE;

-- Optional: Update existing records with data from TMDB
-- This is a comment because it would require a script to fetch from TMDB API
-- You can run this manually or create a one-time script to populate the data

COMMENT ON COLUMN group_schedules.release_date IS 'Release date for movies';
COMMENT ON COLUMN group_schedules.first_air_date IS 'First air date for TV series';
