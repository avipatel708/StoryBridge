-- Migration to add StoryBridge unique features
-- Tables: story_capsules, story_capsule_items, memory_timeline_events, communities, community_members, community_posts, user_badges, story_highlights, story_highlight_items
-- RLS, Indexes, Triggers

----------------------------------------------------
-- 1. TABLES & COLUMNS
----------------------------------------------------

-- Add mood column to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS mood TEXT CHECK (mood IN ('happy', 'inspired', 'excited', 'motivated', 'sad'));

-- Story Capsules: Groups of memories/posts
CREATE TABLE IF NOT EXISTS public.story_capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story Capsule Items: Linking posts to capsules
CREATE TABLE IF NOT EXISTS public.story_capsule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capsule_id UUID NOT NULL REFERENCES public.story_capsules(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(capsule_id, post_id)
);

-- Memory Timeline Events: Life milestones & key events
CREATE TABLE IF NOT EXISTS public.memory_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  icon_type TEXT DEFAULT 'star' CHECK (icon_type IN ('star', 'pen', 'heart', 'users', 'trophy', 'camera', 'milestone', 'custom')),
  is_auto BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communities: User interest groups
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  icon_url TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT TRUE,
  member_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community Members: Links users to communities
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Community Posts: Links posts to communities
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, post_id)
);

-- User Badges: Gamification and achievements
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('top_creator', 'story_writer', 'community_builder', 'photographer', 'explorer', 'early_adopter', 'social_butterfly', 'milestone_100', 'milestone_1000')),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- Story Highlights: Curated collections of expired/active stories on user profile
CREATE TABLE IF NOT EXISTS public.story_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon TEXT DEFAULT '⭐',
  cover_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story Highlight Items: Links individual stories to highlights
CREATE TABLE IF NOT EXISTS public.story_highlight_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id UUID NOT NULL REFERENCES public.story_highlights(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(highlight_id, story_id)
);


----------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
----------------------------------------------------

ALTER TABLE public.story_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_capsule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_highlight_items ENABLE ROW LEVEL SECURITY;

-- Story Capsules Policies
CREATE POLICY "Story capsules are viewable by everyone" ON public.story_capsules
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own story capsules" ON public.story_capsules
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own story capsules" ON public.story_capsules
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own story capsules" ON public.story_capsules
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Story Capsule Items Policies
CREATE POLICY "Capsule items are viewable if capsule is public or user owns it" ON public.story_capsule_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.story_capsules
      WHERE id = capsule_id AND (is_public = true OR user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert items into their own capsules" ON public.story_capsule_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.story_capsules
      WHERE id = capsule_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their own capsules" ON public.story_capsule_items
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.story_capsules
      WHERE id = capsule_id AND user_id = auth.uid()
    )
  );

-- Memory Timeline Events Policies
CREATE POLICY "Timeline events are viewable by everyone" ON public.memory_timeline_events
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own timeline events" ON public.memory_timeline_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timeline events" ON public.memory_timeline_events
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timeline events" ON public.memory_timeline_events
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Communities Policies
CREATE POLICY "Communities are viewable by everyone" ON public.communities
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create communities" ON public.communities
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own communities" ON public.communities
  FOR UPDATE TO authenticated USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own communities" ON public.communities
  FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- Community Members Policies
CREATE POLICY "Community members are viewable by everyone" ON public.community_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join communities" ON public.community_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities" ON public.community_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Community Posts Policies
CREATE POLICY "Community posts are viewable if community is public or user is member" ON public.community_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.communities
      WHERE id = community_id AND (
        is_public = true OR 
        creator_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.community_members WHERE community_id = communities.id AND user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Members can post to community" ON public.community_posts
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.community_members WHERE community_id = community_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.communities WHERE id = community_id AND creator_id = auth.uid())
  );

CREATE POLICY "Community posts can be removed by post owner or community creator/mod" ON public.community_posts
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.communities WHERE id = community_id AND creator_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.community_members WHERE community_id = community_id AND user_id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- User Badges Policies
CREATE POLICY "User badges are viewable by everyone" ON public.user_badges
  FOR SELECT USING (true);

CREATE POLICY "Users can insert/earn their own badges" ON public.user_badges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Story Highlights Policies
CREATE POLICY "Story highlights are viewable by everyone" ON public.story_highlights
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own story highlights" ON public.story_highlights
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own story highlights" ON public.story_highlights
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own story highlights" ON public.story_highlights
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Story Highlight Items Policies
CREATE POLICY "Highlight items are viewable by everyone" ON public.story_highlight_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert items into their own highlights" ON public.story_highlight_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.story_highlights
      WHERE id = highlight_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their own highlights" ON public.story_highlight_items
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.story_highlights
      WHERE id = highlight_id AND user_id = auth.uid()
    )
  );


----------------------------------------------------
-- 3. INDEXES FOR PERFORMANCE
----------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_story_capsules_user_id ON public.story_capsules(user_id);
CREATE INDEX IF NOT EXISTS idx_story_capsule_items_capsule_id ON public.story_capsule_items(capsule_id);
CREATE INDEX IF NOT EXISTS idx_story_capsule_items_post_id ON public.story_capsule_items(post_id);
CREATE INDEX IF NOT EXISTS idx_memory_timeline_events_user_id ON public.memory_timeline_events(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_timeline_events_date ON public.memory_timeline_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_communities_creator_id ON public.communities(creator_id);
CREATE INDEX IF NOT EXISTS idx_communities_slug ON public.communities(slug);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON public.community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_community_id ON public.community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_post_id ON public.community_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_story_highlights_user_id ON public.story_highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_story_highlight_items_highlight_id ON public.story_highlight_items(highlight_id);
CREATE INDEX IF NOT EXISTS idx_story_highlight_items_story_id ON public.story_highlight_items(story_id);


----------------------------------------------------
-- 4. TRIGGERS AND FUNCTIONS
----------------------------------------------------

-- Auto-create timeline event when a profile is created
CREATE OR REPLACE FUNCTION public.handle_new_profile_timeline_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.memory_timeline_events (user_id, title, description, icon_type, is_auto)
  VALUES (
    NEW.id,
    'Joined StoryBridge',
    'Created a profile and embarked on a storytelling journey.',
    'milestone',
    TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_created_timeline
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_timeline_event();

-- Auto-increment/decrement community member_count on member join/leave
CREATE OR REPLACE FUNCTION public.handle_community_member_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities
    SET member_count = member_count + 1, updated_at = NOW()
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities
    SET member_count = GREATEST(0, member_count - 1), updated_at = NOW()
    WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_community_member_change
  AFTER INSERT OR DELETE ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_community_member_change();

-- updated_at triggers for story_capsules and communities
CREATE OR REPLACE TRIGGER on_story_capsules_update
  BEFORE UPDATE ON public.story_capsules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER on_communities_update
  BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


----------------------------------------------------
-- 5. STORAGE BUCKETS
----------------------------------------------------

INSERT INTO storage.buckets (id, name, public) VALUES ('capsules', 'capsules', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('communities', 'communities', true) ON CONFLICT (id) DO NOTHING;
