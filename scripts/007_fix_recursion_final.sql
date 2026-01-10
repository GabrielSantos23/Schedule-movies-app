-- Create a secure function to check group ownership
-- This avoids triggering RLS on the groups table when checking permissions from group_members
CREATE OR REPLACE FUNCTION is_group_creator(_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = _group_id
    AND created_by = auth.uid()
  );
$$;

-- Drop the recursive INSERT policy
DROP POLICY IF EXISTS "Users can join groups via invite" ON public.group_members;

-- Create a new recursion-free INSERT policy
CREATE POLICY "Users can join or manage groups"
  ON public.group_members FOR INSERT
  WITH CHECK (
    -- Users can add themselves (e.g. accepting invite)
    auth.uid() = user_id
    OR
    -- Group creators can add members (using secure function to avoid recursion)
    is_group_creator(group_id)
  );
