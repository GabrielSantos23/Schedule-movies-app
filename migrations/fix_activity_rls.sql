-- FIX RLS Policies for group_activities
-- The previous migration incorrectly referenced 'group_members'. The correct table is 'members'.

-- Drop incorrect policies
DROP POLICY IF EXISTS "Users can view activities in their groups" ON group_activities;
DROP POLICY IF EXISTS "Users can insert activities in their groups" ON group_activities;

-- Create correct policies using 'members' table
CREATE POLICY "Users can view activities in their groups" ON group_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.group_id = group_activities.group_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert activities in their groups" ON group_activities
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM members m
      WHERE m.group_id = group_activities.group_id
      AND m.user_id = auth.uid()
    )
  );
