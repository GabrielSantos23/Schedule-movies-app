-- Migration: Add group_activities table for tracking group activities
-- Run this in your Supabase SQL Editor

-- Create the activities table
CREATE TABLE IF NOT EXISTS group_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('added_movie', 'removed_movie', 'marked_watched', 'showed_interest', 'joined_group', 'scheduled_movie', 'updated_group', 'removed_date')),
  movie_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_group_activities_group_id ON group_activities(group_id);
CREATE INDEX IF NOT EXISTS idx_group_activities_created_at ON group_activities(created_at DESC);

-- Enable RLS
ALTER TABLE group_activities ENABLE ROW LEVEL SECURITY;

-- Policies for group_activities
-- Users can view activities for groups they belong to
CREATE POLICY "Users can view activities in their groups" ON group_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_activities.group_id
      AND gm.user_id = auth.uid()
    )
  );

-- Users can insert activities for groups they belong to
CREATE POLICY "Users can insert activities in their groups" ON group_activities
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_activities.group_id
      AND gm.user_id = auth.uid()
    )
  );

-- Also add full_name column to profiles if it doesn't exist
-- (Run this only if you have a profiles table)
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
