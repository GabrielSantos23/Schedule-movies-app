-- Migration: Add schedule_interests table for tracking member interest in movies
-- Run this in your Supabase SQL Editor

-- Create the interests table
CREATE TABLE IF NOT EXISTS schedule_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES group_schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type INTEGER NOT NULL DEFAULT 1 CHECK (vote_type IN (1, -1)), -- 1 for upvote, -1 for downvote
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Each user can only have one vote record per schedule
  UNIQUE(schedule_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_schedule_interests_schedule_id ON schedule_interests(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_interests_user_id ON schedule_interests(user_id);

-- Enable RLS
ALTER TABLE schedule_interests ENABLE ROW LEVEL SECURITY;

-- Policies for schedule_interests
-- Users can view interests for schedules in groups they belong to
CREATE POLICY "Users can view interests in their groups" ON schedule_interests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_schedules gs
      JOIN group_members gm ON gs.group_id = gm.group_id
      WHERE gs.id = schedule_interests.schedule_id
      AND gm.user_id = auth.uid()
    )
  );

-- Users can insert their own interests
CREATE POLICY "Users can insert their own interests" ON schedule_interests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM group_schedules gs
      JOIN group_members gm ON gs.group_id = gm.group_id
      WHERE gs.id = schedule_interests.schedule_id
      AND gm.user_id = auth.uid()
    )
  );

-- Users can update their own interests
CREATE POLICY "Users can update their own interests" ON schedule_interests
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own interests
CREATE POLICY "Users can delete their own interests" ON schedule_interests
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_schedule_interests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_schedule_interests_updated_at ON schedule_interests;
CREATE TRIGGER trigger_update_schedule_interests_updated_at
  BEFORE UPDATE ON schedule_interests
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_interests_updated_at();
