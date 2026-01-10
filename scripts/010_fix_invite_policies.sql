-- Allow anyone to view invite links (so they can be validated)
DROP POLICY IF EXISTS "Group members can view invite links" ON public.invite_links;
CREATE POLICY "Anyone can view invite links" ON public.invite_links FOR SELECT USING (true);

-- Allow anyone to view groups that have an invite link
-- This is necessary so the invite page can fetch the group name/description
CREATE POLICY "Anyone can view groups with invites" ON public.groups FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.invite_links 
    WHERE invite_links.group_id = groups.id
  )
);
