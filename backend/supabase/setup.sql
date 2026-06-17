-- StoryBridge database setup (idempotent — safe to run more than once)
-- Run in Supabase Dashboard → SQL Editor, or: npm run db:setup

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

----------------------------------------------------
-- 1. TABLES
----------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  interests TEXT[] DEFAULT '{}',
  is_onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE TABLE IF NOT EXISTS public.saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'mention', 'message')),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  message TEXT NOT NULL DEFAULT '',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_two UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_one, participant_two)
);

CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

----------------------------------------------------
-- 2. RLS
----------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can like posts" ON public.likes;
CREATE POLICY "Authenticated users can like posts" ON public.likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes;
CREATE POLICY "Users can delete their own likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Followers are viewable by everyone" ON public.followers;
CREATE POLICY "Followers are viewable by everyone" ON public.followers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can follow" ON public.followers;
CREATE POLICY "Authenticated users can follow" ON public.followers FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON public.followers;
CREATE POLICY "Users can unfollow" ON public.followers FOR DELETE USING (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can view their own saved posts" ON public.saved_posts;
CREATE POLICY "Users can view their own saved posts" ON public.saved_posts FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save posts" ON public.saved_posts;
CREATE POLICY "Users can save posts" ON public.saved_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave posts" ON public.saved_posts;
CREATE POLICY "Users can unsave posts" ON public.saved_posts FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT TO authenticated USING (auth.uid() = participant_one OR auth.uid() = participant_two);

DROP POLICY IF EXISTS "Users can insert/update conversations" ON public.conversations;
CREATE POLICY "Users can insert/update conversations" ON public.conversations FOR ALL TO authenticated USING (auth.uid() = participant_one OR auth.uid() = participant_two);

DROP POLICY IF EXISTS "Stories are viewable by everyone" ON public.stories;
CREATE POLICY "Stories are viewable by everyone" ON public.stories FOR SELECT USING (expires_at > NOW());

DROP POLICY IF EXISTS "Authenticated users can upload stories" ON public.stories;
CREATE POLICY "Authenticated users can upload stories" ON public.stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own stories" ON public.stories;
CREATE POLICY "Users can delete their own stories" ON public.stories FOR DELETE USING (auth.uid() = user_id);

----------------------------------------------------
-- 3. INDEXES
----------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON public.followers(following_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON public.saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(participant_one, participant_two);
CREATE INDEX IF NOT EXISTS idx_stories_user_expires ON public.stories(user_id, expires_at);

----------------------------------------------------
-- 4. TRIGGERS
----------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, is_onboarded)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_update ON public.profiles;
CREATE TRIGGER on_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_post_update ON public.posts;
CREATE TRIGGER on_post_update
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
DECLARE
  p1 UUID;
  p2 UUID;
BEGIN
  IF NEW.sender_id < NEW.receiver_id THEN
    p1 := NEW.sender_id;
    p2 := NEW.receiver_id;
  ELSE
    p1 := NEW.receiver_id;
    p2 := NEW.sender_id;
  END IF;

  INSERT INTO public.conversations (participant_one, participant_two, last_message_at)
  VALUES (p1, p2, NEW.created_at)
  ON CONFLICT (participant_one, participant_two) DO UPDATE
  SET last_message_at = NEW.created_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_message_sent ON public.messages;
CREATE TRIGGER on_message_sent
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();

CREATE OR REPLACE FUNCTION public.handle_create_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  actor_name TEXT;
  notif_message TEXT;
BEGIN
  IF TG_TABLE_NAME = 'likes' THEN
    SELECT user_id INTO target_user_id FROM public.posts WHERE id = NEW.post_id;
    IF target_user_id != NEW.user_id THEN
      SELECT full_name INTO actor_name FROM public.profiles WHERE id = NEW.user_id;
      notif_message := COALESCE(actor_name, 'Someone') || ' liked your post.';
      INSERT INTO public.notifications (user_id, actor_id, type, post_id, message)
      VALUES (target_user_id, NEW.user_id, 'like', NEW.post_id, notif_message);
    END IF;
  ELSIF TG_TABLE_NAME = 'comments' THEN
    SELECT user_id INTO target_user_id FROM public.posts WHERE id = NEW.post_id;
    IF target_user_id != NEW.user_id THEN
      SELECT full_name INTO actor_name FROM public.profiles WHERE id = NEW.user_id;
      notif_message := COALESCE(actor_name, 'Someone') || ' commented on your post.';
      INSERT INTO public.notifications (user_id, actor_id, type, post_id, message)
      VALUES (target_user_id, NEW.user_id, 'comment', NEW.post_id, notif_message);
    END IF;
  ELSIF TG_TABLE_NAME = 'followers' THEN
    target_user_id := NEW.following_id;
    SELECT full_name INTO actor_name FROM public.profiles WHERE id = NEW.follower_id;
    notif_message := COALESCE(actor_name, 'Someone') || ' started following you.';
    INSERT INTO public.notifications (user_id, actor_id, type, message)
    VALUES (target_user_id, NEW.follower_id, 'follow', notif_message);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_like_created ON public.likes;
CREATE TRIGGER on_like_created AFTER INSERT ON public.likes FOR EACH ROW EXECUTE FUNCTION public.handle_create_notification();

DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
CREATE TRIGGER on_comment_created AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.handle_create_notification();

DROP TRIGGER IF EXISTS on_follow_created ON public.followers;
CREATE TRIGGER on_follow_created AFTER INSERT ON public.followers FOR EACH ROW EXECUTE FUNCTION public.handle_create_notification();

-- Backfill profiles for existing auth users
INSERT INTO public.profiles (id, username, full_name, is_onboarded)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', 'user_' || substr(u.id::text, 1, 8)),
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  FALSE
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

----------------------------------------------------
-- 5. STORAGE BUCKETS
----------------------------------------------------

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('posts', 'posts', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('stories', 'stories', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can update avatars" ON storage.objects;
CREATE POLICY "Users can update avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Cover images are publicly accessible" ON storage.objects;
CREATE POLICY "Cover images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'covers');

DROP POLICY IF EXISTS "Users can upload covers" ON storage.objects;
CREATE POLICY "Users can upload covers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'covers');

DROP POLICY IF EXISTS "Users can update covers" ON storage.objects;
CREATE POLICY "Users can update covers" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'covers');

DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects;
CREATE POLICY "Post images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'posts');

DROP POLICY IF EXISTS "Users can upload posts" ON storage.objects;
CREATE POLICY "Users can upload posts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'posts');

DROP POLICY IF EXISTS "Story images are publicly accessible" ON storage.objects;
CREATE POLICY "Story images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'stories');

DROP POLICY IF EXISTS "Users can upload stories" ON storage.objects;
CREATE POLICY "Users can upload stories" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'stories');

-- Reload PostgREST schema cache so the API sees new tables immediately
NOTIFY pgrst, 'reload schema';
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

----------------------------------------------------
-- 7. INSTAGRAM FEATURES SCHEMA ADDITIONS
----------------------------------------------------

-- Comments table updates for nesting and pinning
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Stories table updates for stickers, scheduling, and audio
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS stickers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS audio_track_id UUID DEFAULT NULL;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS audio_start_time INTEGER DEFAULT 0;

-- Posts table updates for scheduling and audio
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS audio_track_id UUID DEFAULT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS audio_start_time INTEGER DEFAULT 0;

-- Reels table updates for scheduling and audio
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS audio_track_id UUID DEFAULT NULL;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS audio_start_time INTEGER DEFAULT 0;

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
  lyrics JSONB DEFAULT '[]'::jsonb,
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
  completion_rate NUMERIC DEFAULT 0.0,
  story_reach INTEGER DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0.0,
  exits INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foreign Key Constraints
ALTER TABLE public.stories ADD CONSTRAINT fk_stories_audio FOREIGN KEY (audio_track_id) REFERENCES public.audio_tracks(id) ON DELETE SET NULL;
ALTER TABLE public.posts ADD CONSTRAINT fk_posts_audio FOREIGN KEY (audio_track_id) REFERENCES public.audio_tracks(id) ON DELETE SET NULL;
ALTER TABLE public.reels ADD CONSTRAINT fk_reels_audio FOREIGN KEY (audio_track_id) REFERENCES public.audio_tracks(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_analytics ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Comment likes are viewable by everyone" ON public.comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like comments" ON public.comment_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment likes" ON public.comment_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Audio tracks are viewable by everyone" ON public.audio_tracks
  FOR SELECT USING (true);

CREATE POLICY "Post media is viewable by everyone" ON public.post_media
  FOR SELECT USING (true);

CREATE POLICY "Post owners can manage media" ON public.post_media
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_id AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Collections are viewable by owner" ON public.collections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create collections" ON public.collections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" ON public.collections
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" ON public.collections
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

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

-- Indexes
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

-- Triggers & Functions
CREATE OR REPLACE TRIGGER on_collections_update
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

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

-- Seed tracks
INSERT INTO public.audio_tracks (title, artist, audio_url, cover_url, duration_seconds, lyrics)
VALUES 
  ('Lofi Sunset', 'Chill Beats', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=150&h=150&fit=crop', 30, '[{"time":0,"text":"As the sun sets down..."},{"time":5,"text":"We feel the warm breeze around..."},{"time":10,"text":"Lofi vibes inside our soul..."},{"time":15,"text":"Letting go of all control..."}]'::jsonb),
  ('Synthwave Drive', 'Retro Wave', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&h=150&fit=crop', 30, '[{"time":0,"text":"Cruising down the neon street"},{"time":6,"text":"Synth beats moving to our feet"},{"time":12,"text":"Eighties dreams under the light"},{"time":18,"text":"We will ride into the night"}]'::jsonb),
  ('Acoustic Breeze', 'Summer Folk', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&h=150&fit=crop', 30, '[{"time":0,"text":"Strings of silver, strings of gold"},{"time":5,"text":"Warmest stories ever told"},{"time":11,"text":"Walk with me along the sand"},{"time":17,"text":"Take my heart and take my hand"}]'::jsonb)
ON CONFLICT DO NOTHING;


