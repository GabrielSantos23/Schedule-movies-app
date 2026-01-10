-- Allow any group member to DELETE any schedule in the group
DROP POLICY IF EXISTS "Users can delete their own group schedules" ON public.group_schedules;

CREATE POLICY "Group members can delete group schedules"
  ON public.group_schedules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_schedules.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Allow any group member to UPDATE any schedule in the group
DROP POLICY IF EXISTS "Users can update their own group schedules" ON public.group_schedules;

CREATE POLICY "Group members can update group schedules"
  ON public.group_schedules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_schedules.group_id
      AND group_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_schedules.group_id
      AND group_members.user_id = auth.uid()
    )
  );
