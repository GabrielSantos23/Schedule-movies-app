-- FIX TOTAL: Updates constraints and RLS
-- Correct table used: group_members

BEGIN;

-- 1. Update allowed actions constraint
ALTER TABLE group_activities DROP CONSTRAINT IF EXISTS group_activities_action_check;
ALTER TABLE group_activities ADD CONSTRAINT group_activities_action_check 
CHECK (action IN (
  'added_movie', 
  'removed_movie', 
  'marked_watched', 
  'showed_interest', 
  'joined_group', 
  'scheduled_movie', 
  'updated_group', 
  'removed_date'
));

-- 2. Recreate RLS Policies (pointing to group_members)
DROP POLICY IF EXISTS "Users can view activities in their groups" ON group_activities;
DROP POLICY IF EXISTS "Users can insert activities in their groups" ON group_activities;

CREATE POLICY "Users can view activities in their groups" ON group_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_activities.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert activities in their groups" ON group_activities
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_activities.group_id
      AND gm.user_id = auth.uid()
    )
  );

COMMIT;
