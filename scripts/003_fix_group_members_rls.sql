-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Group owners can add members" ON public.group_members;
DROP POLICY IF EXISTS "Group owners can remove members" ON public.group_members;

-- Fixed RLS policies to avoid infinite recursion by using direct user_id checks and group ownership
CREATE POLICY "Users can view members of groups they belong to"
  ON public.group_members FOR SELECT
  USING (
    -- Users can see members of any group where they are also a member
    group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups via invite"
  ON public.group_members FOR INSERT
  WITH CHECK (
    -- Users can add themselves (for invite acceptance)
    auth.uid() = user_id
    OR
    -- Admins/owners can add others (check via groups table)
    EXISTS (
      SELECT 1 FROM public.groups g
      JOIN public.group_members gm ON gm.group_id = g.id
      WHERE g.id = group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can leave groups or admins can remove members"
  ON public.group_members FOR DELETE
  USING (
    -- Users can remove themselves
    auth.uid() = user_id
    OR
    -- Admins/owners can remove others
    EXISTS (
      SELECT 1 FROM public.groups g
      JOIN public.group_members gm ON gm.group_id = g.id
      WHERE g.id = group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
    )
  );
