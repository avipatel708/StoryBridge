-- Migration 006: Complete Instagram Features Schema Additions
-- Contains nested comments, comment likes, collections, audio tracks, story stickers, scheduled posting, story analytics, and carousel post media.

----------------------------------------------------
-- 1. ADD COLUMNS TO EXISTING TABLES
----------------------------------------------------

-- Comments table updates for nesting and pinning
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Stories table updates for stickers, scheduling, and audio
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS stickers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS audio_track_id UUID DEFAULT NULL;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS audio_start_time INTEGER DEFAULT 0; -- in seconds

-- Posts table updates for scheduling and audio
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS audio_track_id UUID DEFAULT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS audio_start_time INTEGER DEFAULT 0;

-- Reels table updates for scheduling and audio
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS audio_track_id UUID DEFAULT NULL;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS audio_start_time INTEGER DEFAULT 0;

----------------------------------------------------
-- 2. CREATE NEW TABLES
----------------------------------------------------

-- Comment Likes
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Audio Tracks Table (Music Library)
CREATE TABLE IF NOT EXISTS public.audio_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  cover_url TEXT DEFAULT '',
  duration_seconds INTEGER DEFAULT 30,
  lyrics JSONB DEFAULT '[]'::jsonb, -- Array of {time: number, text: string}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Media Table (for Multi-media Carousel Posts)
CREATE TABLE IF NOT EXISTS public.post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collections Table (for Bookmarks/Saved items)
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cover_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection Items Table
CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  reel_id UUID REFERENCES public.reels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_item_type CHECK (
    (post_id IS NOT NULL AND reel_id IS NULL) OR
    (reel_id IS NOT NULL AND post_id IS NULL)
  ),
  UNIQUE(collection_id, post_id),
  UNIQUE(collection_id, reel_id)
);

-- Story Analytics Table
CREATE TABLE IF NOT EXISTS public.story_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE UNIQUE,
  total_views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  completion_rate NUMERIC DEFAULT 0.0, -- percentage (0-100)
  story_reach INTEGER DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0.0,
  exits INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

----------------------------------------------------
-- 3. FOREIGN KEY RELATIONSHIPS FOR EXISTING COLUMNS
----------------------------------------------------
ALTER TABLE public.stories ADD CONSTRAINT fk_stories_audio FOREIGN KEY (audio_track_id) REFERENCES public.audio_tracks(id) ON DELETE SET NULL;
ALTER TABLE public.posts ADD CONSTRAINT fk_posts_audio FOREIGN KEY (audio_track_id) REFERENCES public.audio_tracks(id) ON DELETE SET NULL;
ALTER TABLE public.reels ADD CONSTRAINT fk_reels_audio FOREIGN KEY (audio_track_id) REFERENCES public.audio_tracks(id) ON DELETE SET NULL;

----------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
----------------------------------------------------

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_analytics ENABLE ROW LEVEL SECURITY;

-- Comment Likes Policies
CREATE POLICY "Comment likes are viewable by everyone" ON public.comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like comments" ON public.comment_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment likes" ON public.comment_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Audio Tracks Policies
CREATE POLICY "Audio tracks are viewable by everyone" ON public.audio_tracks
  FOR SELECT USING (true);

-- Post Media Policies
CREATE POLICY "Post media is viewable by everyone" ON public.post_media
  FOR SELECT USING (true);

CREATE POLICY "Post owners can manage media" ON public.post_media
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_id AND posts.user_id = auth.uid()
    )
  );

-- Collections Policies
CREATE POLICY "Collections are viewable by owner" ON public.collections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create collections" ON public.collections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" ON public.collections
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" ON public.collections
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Collection Items Policies
CREATE POLICY "Collection items are viewable by owner" ON public.collection_items
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_id AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add items to their collections" ON public.collection_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_id AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove items from their collections" ON public.collection_items
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_id AND collections.user_id = auth.uid()
    )
  );

-- Story Analytics Policies
CREATE POLICY "Story analytics are viewable by story creator only" ON public.story_analytics
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.stories
      WHERE stories.id = story_id AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Story analytics can be inserted/updated by system or creator" ON public.story_analytics
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.stories
      WHERE stories.id = story_id AND stories.user_id = auth.uid()
    )
  );

----------------------------------------------------
-- 5. INDEXES FOR PERFORMANCE
----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON public.comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_media_post ON public.post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_collections_user ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_coll ON public.collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_story_analytics_story ON public.story_analytics(story_id);
CREATE INDEX IF NOT EXISTS idx_stories_scheduled_at ON public.stories(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON public.posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reels_scheduled_at ON public.reels(scheduled_at);

----------------------------------------------------
-- 6. TRIGGERS AND FUNCTIONS
----------------------------------------------------

CREATE OR REPLACE TRIGGER on_collections_update
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto create story analytics row on story insert
CREATE OR REPLACE FUNCTION public.handle_story_analytics_init()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.story_analytics (story_id)
  VALUES (NEW.id)
  ON CONFLICT (story_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_story_inserted
  AFTER INSERT ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.handle_story_analytics_init();

-- Seed some default audio tracks
INSERT INTO public.audio_tracks (title, artist, audio_url, cover_url, duration_seconds, lyrics)
VALUES 
  ('Lofi Sunset', 'Chill Beats', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=150&h=150&fit=crop', 30, '[{"time":0,"text":"As the sun sets down..."},{"time":5,"text":"We feel the warm breeze around..."},{"time":10,"text":"Lofi vibes inside our soul..."},{"time":15,"text":"Letting go of all control..."}]'::jsonb),
  ('Synthwave Drive', 'Retro Wave', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&h=150&fit=crop', 30, '[{"time":0,"text":"Cruising down the neon street"},{"time":6,"text":"Synth beats moving to our feet"},{"time":12,"text":"Eighties dreams under the light"},{"time":18,"text":"We will ride into the night"}]'::jsonb),
  ('Acoustic Breeze', 'Summer Folk', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&h=150&fit=crop', 30, '[{"time":0,"text":"Strings of silver, strings of gold"},{"time":5,"text":"Warmest stories ever told"},{"time":11,"text":"Walk with me along the sand"},{"time":17,"text":"Take my heart and take my hand"}]'::jsonb)
ON CONFLICT DO NOTHING;
