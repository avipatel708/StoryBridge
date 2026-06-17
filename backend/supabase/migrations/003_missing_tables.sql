-- Migration to add remaining tables specified in requirements: story_views, friendship_journeys, memory_timelines
-- Enables RLS policies, creates tables, indexes, and constraints.

----------------------------------------------------
-- 1. TABLES
----------------------------------------------------

-- Story Views: Tracks views on temporary stories
CREATE TABLE IF NOT EXISTS public.story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

-- Friendship Journeys: Explicit tracking of friendships and milestones
CREATE TABLE IF NOT EXISTS public.friendship_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_one_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_two_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  friends_since TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_one_id, user_two_id),
  CHECK (user_one_id != user_two_id)
);

-- Memory Timelines: Dynamic timeline settings/metadata per profile
CREATE TABLE IF NOT EXISTS public.memory_timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme_color TEXT DEFAULT '#6366F1',
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

----------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
----------------------------------------------------

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendship_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_timelines ENABLE ROW LEVEL SECURITY;

-- Story Views Policies
DROP POLICY IF EXISTS "Users can view their own story views" ON public.story_views;
CREATE POLICY "Users can view their own story views" ON public.story_views
  FOR SELECT TO authenticated USING (
    viewer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert story views" ON public.story_views;
CREATE POLICY "Users can insert story views" ON public.story_views
  FOR INSERT TO authenticated WITH CHECK (viewer_id = auth.uid());

-- Friendship Journeys Policies
DROP POLICY IF EXISTS "Friendship journeys are viewable by participants" ON public.friendship_journeys;
CREATE POLICY "Friendship journeys are viewable by participants" ON public.friendship_journeys
  FOR SELECT USING (user_one_id = auth.uid() OR user_two_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create friendship journeys" ON public.friendship_journeys;
CREATE POLICY "Authenticated users can create friendship journeys" ON public.friendship_journeys
  FOR INSERT TO authenticated WITH CHECK (user_one_id = auth.uid() OR user_two_id = auth.uid());

-- Memory Timelines Policies
DROP POLICY IF EXISTS "Memory timelines are public" ON public.memory_timelines;
CREATE POLICY "Memory timelines are public" ON public.memory_timelines
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own memory timeline" ON public.memory_timelines;
CREATE POLICY "Users can update their own memory timeline" ON public.memory_timelines
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own memory timeline" ON public.memory_timelines;
CREATE POLICY "Users can insert their own memory timeline" ON public.memory_timelines
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

----------------------------------------------------
-- 3. INDEXES
----------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON public.story_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_friendship_journeys_users ON public.friendship_journeys(user_one_id, user_two_id);
CREATE INDEX IF NOT EXISTS idx_memory_timelines_user_id ON public.memory_timelines(user_id);
