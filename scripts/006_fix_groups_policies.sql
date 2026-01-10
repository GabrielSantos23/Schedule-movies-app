-- Fix the SELECT policy for groups to include created_by check
-- This is necessary because when a group is first created, the user is not yet a member
-- but the insert(...).select() call triggers the SELECT policy.

DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;

CREATE POLICY "Users can view groups they are members of or created"
  ON public.groups FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

-- Also ensure the INSERT policy is correctly set (re-applying just in case)
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;

CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);
