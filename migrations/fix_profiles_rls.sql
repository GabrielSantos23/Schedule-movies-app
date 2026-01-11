-- Ensure profiles are readable by everyone so we can fetch names
-- Run this in Supabase SQL Editor

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING ( true );
