-- Drop and recreate the INSERT policy to fix infinite recursion
DROP POLICY IF EXISTS "Users can join groups via invite" ON public.group_members;

-- Simplified INSERT policy that doesn't query group_members
CREATE POLICY "Users can join groups via invite"
  ON public.group_members FOR INSERT
  WITH CHECK (
    -- Users can add themselves (for invite acceptance and initial group creation)
    auth.uid() = user_id
    OR
    -- Group creators (owners in groups table) can add others
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_id
      AND g.created_by = auth.uid()
    )
  );
