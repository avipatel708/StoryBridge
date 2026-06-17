-- =============================================================
-- StoryBridge: Fix Storage Upload Permissions
-- =============================================================
-- Run this in your Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/fmbzsljswafgvpfwiwyl/sql/new
-- =============================================================

-- Step 1: Ensure all storage buckets exist and are PUBLIC
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('avatars', 'avatars', true),
  ('covers', 'covers', true),
  ('posts', 'posts', true),
  ('stories', 'stories', true),
  ('reels', 'reels', true),
  ('chat_media', 'chat_media', true),
  ('capsules', 'capsules', true),
  ('communities', 'communities', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 2: Remove ALL old storage policies to start fresh
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END
$$;

-- Step 3: Create PUBLIC READ policies for ALL buckets
CREATE POLICY "Public read for avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Public read for covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'covers');

CREATE POLICY "Public read for posts" ON storage.objects
  FOR SELECT USING (bucket_id = 'posts');

CREATE POLICY "Public read for stories" ON storage.objects
  FOR SELECT USING (bucket_id = 'stories');

CREATE POLICY "Public read for reels" ON storage.objects
  FOR SELECT USING (bucket_id = 'reels');

CREATE POLICY "Public read for chat_media" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat_media');

CREATE POLICY "Public read for capsules" ON storage.objects
  FOR SELECT USING (bucket_id = 'capsules');

CREATE POLICY "Public read for communities" ON storage.objects
  FOR SELECT USING (bucket_id = 'communities');

-- Step 4: Create UPLOAD (INSERT) policies for authenticated users
CREATE POLICY "Auth upload avatars" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Auth upload covers" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'covers');

CREATE POLICY "Auth upload posts" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'posts');

CREATE POLICY "Auth upload stories" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'stories');

CREATE POLICY "Auth upload reels" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reels');

CREATE POLICY "Auth upload chat_media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat_media');

CREATE POLICY "Auth upload capsules" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'capsules');

CREATE POLICY "Auth upload communities" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'communities');

-- Step 5: Create UPDATE policies for authenticated users
CREATE POLICY "Auth update avatars" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

CREATE POLICY "Auth update covers" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'covers');

CREATE POLICY "Auth update posts" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'posts');

CREATE POLICY "Auth update stories" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'stories');

CREATE POLICY "Auth update reels" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'reels');

CREATE POLICY "Auth update chat_media" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'chat_media');

CREATE POLICY "Auth update capsules" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'capsules');

CREATE POLICY "Auth update communities" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'communities');

-- Step 6: Create DELETE policies for authenticated users
CREATE POLICY "Auth delete avatars" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'avatars');

CREATE POLICY "Auth delete covers" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'covers');

CREATE POLICY "Auth delete posts" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'posts');

CREATE POLICY "Auth delete stories" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'stories');

CREATE POLICY "Auth delete reels" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'reels');

CREATE POLICY "Auth delete chat_media" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'chat_media');

CREATE POLICY "Auth delete capsules" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'capsules');

CREATE POLICY "Auth delete communities" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'communities');
