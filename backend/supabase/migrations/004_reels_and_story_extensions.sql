-- Migration 004: Reels and Story/Message Enhancements
-- Creates tables: reels, reel_likes, reel_comments, reel_saves, story_likes, story_comments, story_mentions
-- Adds columns to public.stories and public.messages
-- Configures RLS policies, indexes, and storage buckets

----------------------------------------------------
-- 1. EXTEND EXISTING TABLES
----------------------------------------------------

-- Alter public.stories to support video stories
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video'));
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';

-- Alter public.messages to support rich chat media, reactions, and shared items
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'voice', 'story_share', 'reel_share', 'post_share'));
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_url TEXT DEFAULT '';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS shared_item_id UUID DEFAULT NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb;

-- Modify stories table select policy to allow owner to view expired stories (archive)
-- First drop the old policy from initial schema
DROP POLICY IF EXISTS "Stories are viewable by everyone" ON public.stories;
CREATE POLICY "Stories are viewable if active or owned by creator" ON public.stories
  FOR SELECT USING (expires_at > NOW() OR auth.uid() = user_id);

----------------------------------------------------
-- 2. CREATE NEW TABLES
----------------------------------------------------

-- Reels Table
CREATE TABLE IF NOT EXISTS public.reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  cover_url TEXT DEFAULT '',
  caption TEXT DEFAULT '',
  hashtags TEXT[] DEFAULT '{}',
  location TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reel Likes
CREATE TABLE IF NOT EXISTS public.reel_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reel_id, user_id)
);

-- Reel Comments
CREATE TABLE IF NOT EXISTS public.reel_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reel Saves
CREATE TABLE IF NOT EXISTS public.reel_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reel_id, user_id)
);

-- Story Likes
CREATE TABLE IF NOT EXISTS public.story_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

-- Story Comments (Replies)
CREATE TABLE IF NOT EXISTS public.story_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story Mentions
CREATE TABLE IF NOT EXISTS public.story_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

----------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
----------------------------------------------------

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_mentions ENABLE ROW LEVEL SECURITY;

-- Reels policies
DROP POLICY IF EXISTS "Reels are viewable by everyone" ON public.reels;
CREATE POLICY "Reels are viewable by everyone" ON public.reels
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert reels" ON public.reels;
CREATE POLICY "Authenticated users can insert reels" ON public.reels
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reels" ON public.reels;
CREATE POLICY "Users can update their own reels" ON public.reels
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reels" ON public.reels;
CREATE POLICY "Users can delete their own reels" ON public.reels
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Reel Likes policies
DROP POLICY IF EXISTS "Reel likes are viewable by everyone" ON public.reel_likes;
CREATE POLICY "Reel likes are viewable by everyone" ON public.reel_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can like reels" ON public.reel_likes;
CREATE POLICY "Authenticated users can like reels" ON public.reel_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike reels" ON public.reel_likes;
CREATE POLICY "Users can unlike reels" ON public.reel_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Reel Comments policies
DROP POLICY IF EXISTS "Reel comments are viewable by everyone" ON public.reel_comments;
CREATE POLICY "Reel comments are viewable by everyone" ON public.reel_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can comment on reels" ON public.reel_comments;
CREATE POLICY "Authenticated users can comment on reels" ON public.reel_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reel comments" ON public.reel_comments;
CREATE POLICY "Users can delete their own reel comments" ON public.reel_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Reel Saves policies
DROP POLICY IF EXISTS "Reel saves are viewable by owner" ON public.reel_saves;
CREATE POLICY "Reel saves are viewable by owner" ON public.reel_saves
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can save reels" ON public.reel_saves;
CREATE POLICY "Authenticated users can save reels" ON public.reel_saves
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave reels" ON public.reel_saves;
CREATE POLICY "Users can unsave reels" ON public.reel_saves
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Story Likes policies
DROP POLICY IF EXISTS "Story likes are viewable if story is viewable" ON public.story_likes;
CREATE POLICY "Story likes are viewable if story is viewable" ON public.story_likes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stories WHERE id = story_id)
  );

DROP POLICY IF EXISTS "Authenticated users can like stories" ON public.story_likes;
CREATE POLICY "Authenticated users can like stories" ON public.story_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike stories" ON public.story_likes;
CREATE POLICY "Users can unlike stories" ON public.story_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Story Comments policies
DROP POLICY IF EXISTS "Story comments are viewable if story is viewable" ON public.story_comments;
CREATE POLICY "Story comments are viewable if story is viewable" ON public.story_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stories WHERE id = story_id)
  );

DROP POLICY IF EXISTS "Authenticated users can comment on stories" ON public.story_comments;
CREATE POLICY "Authenticated users can comment on stories" ON public.story_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own story comments" ON public.story_comments;
CREATE POLICY "Users can delete their own story comments" ON public.story_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Story Mentions policies
DROP POLICY IF EXISTS "Story mentions are viewable if story is viewable" ON public.story_mentions;
CREATE POLICY "Story mentions are viewable if story is viewable" ON public.story_mentions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stories WHERE id = story_id)
  );

DROP POLICY IF EXISTS "Authenticated users can add mentions to stories" ON public.story_mentions;
CREATE POLICY "Authenticated users can add mentions to stories" ON public.story_mentions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR EXISTS(SELECT 1 FROM public.stories WHERE id = story_id AND user_id = auth.uid()));

----------------------------------------------------
-- 4. TRIGGERS AND FUNCTIONS
----------------------------------------------------

CREATE OR REPLACE TRIGGER on_reels_update
  BEFORE UPDATE ON public.reels
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

----------------------------------------------------
-- 5. INDEXES FOR PERFORMANCE
----------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_reels_user_id ON public.reels(user_id);
CREATE INDEX IF NOT EXISTS idx_reel_likes_reel ON public.reel_likes(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_likes_user ON public.reel_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_reel_comments_reel ON public.reel_comments(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_saves_user ON public.reel_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_story ON public.story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_story ON public.story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_story_mentions_story ON public.story_mentions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_mentions_user ON public.story_mentions(user_id);

----------------------------------------------------
-- 6. STORAGE BUCKETS
----------------------------------------------------

INSERT INTO storage.buckets (id, name, public) VALUES ('reels', 'reels', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('chat_media', 'chat_media', true) ON CONFLICT (id) DO NOTHING;
