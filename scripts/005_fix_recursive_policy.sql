-- Create a secure function to get user's groups to avoid recursion
-- This function runs with security definer privileges, bypassing RLS
CREATE OR REPLACE FUNCTION get_user_group_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT group_id FROM group_members WHERE user_id = auth.uid();
$$;

-- Drop the potentially problematic policies
DROP POLICY IF EXISTS "Users can view members of groups they belong to" ON public.group_members;
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;

-- Create the new non-recursive retrieval policy
CREATE POLICY "Users can view members of groups they belong to"
  ON public.group_members FOR SELECT
  USING (
    group_id IN (
      SELECT get_user_group_ids()
    )
  );
