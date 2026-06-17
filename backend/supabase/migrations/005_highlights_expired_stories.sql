-- Migration 005: Allow expired stories to be viewed when part of highlights
-- This fixes the issue where Story Highlights show "Story media has been removed"
-- after the 24-hour story expiration window.

-- Update the stories RLS SELECT policy to also allow viewing expired stories
-- that exist in any story_highlight_items entry.
DROP POLICY IF EXISTS "Stories are viewable if active or owned by creator" ON public.stories;

CREATE POLICY "Stories are viewable if active, owned, or in highlights" ON public.stories
  FOR SELECT USING (
    expires_at > NOW()
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.story_highlight_items
      WHERE story_highlight_items.story_id = id
    )
  );
