-- Allow any group member to DELETE the group
DROP POLICY IF EXISTS "Group owners can delete groups" ON public.groups;

CREATE POLICY "Group members can delete groups"
  ON public.groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

-- Allow any group member to UPDATE the group
DROP POLICY IF EXISTS "Group owners can update groups" ON public.groups;

CREATE POLICY "Group members can update groups"
  ON public.groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );
