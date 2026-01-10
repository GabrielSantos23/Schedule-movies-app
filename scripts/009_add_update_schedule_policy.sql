-- Add policy to allow users to update their own schedules
CREATE POLICY "Users can update their own group schedules"
  ON public.group_schedules FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
