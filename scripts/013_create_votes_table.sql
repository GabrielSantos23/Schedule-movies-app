
-- Create schedule_votes table
CREATE TABLE IF NOT EXISTS public.schedule_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.group_schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(schedule_id, user_id)
);

-- Enable RLS
ALTER TABLE public.schedule_votes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Group members can view votes"
  ON public.schedule_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_schedules s
      JOIN public.group_members m ON s.group_id = m.group_id
      WHERE s.id = schedule_votes.schedule_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can vote"
  ON public.schedule_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.group_schedules s
      JOIN public.group_members m ON s.group_id = m.group_id
      WHERE s.id = schedule_votes.schedule_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove their own votes"
  ON public.schedule_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schedule_votes_schedule_id ON public.schedule_votes(schedule_id);
