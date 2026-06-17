-- StoryBridge SQL Script to Create All Required Storage Buckets and Set Up Policies
-- Run this in your Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new)

-- 1. Create all storage buckets (Safe Insert)
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
ON CONFLICT (id) DO NOTHING;

-- 2. Enable public read access for all buckets (SELECT Policies)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects 
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Cover images are publicly accessible" ON storage.objects;
CREATE POLICY "Cover images are publicly accessible" ON storage.objects 
  FOR SELECT USING (bucket_id = 'covers');

DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects;
CREATE POLICY "Post images are publicly accessible" ON storage.objects 
  FOR SELECT USING (bucket_id = 'posts');

DROP POLICY IF EXISTS "Story images are publicly accessible" ON storage.objects;
CREATE POLICY "Story images are publicly accessible" ON storage.objects 
  FOR SELECT USING (bucket_id = 'stories');

DROP POLICY IF EXISTS "Reel videos are publicly accessible" ON storage.objects;
CREATE POLICY "Reel videos are publicly accessible" ON storage.objects 
  FOR SELECT USING (bucket_id = 'reels');

DROP POLICY IF EXISTS "Chat media is publicly accessible" ON storage.objects;
CREATE POLICY "Chat media is publicly accessible" ON storage.objects 
  FOR SELECT USING (bucket_id = 'chat_media');

DROP POLICY IF EXISTS "Capsule images are publicly accessible" ON storage.objects;
CREATE POLICY "Capsule images are publicly accessible" ON storage.objects 
  FOR SELECT USING (bucket_id = 'capsules');

DROP POLICY IF EXISTS "Community images are publicly accessible" ON storage.objects;
CREATE POLICY "Community images are publicly accessible" ON storage.objects 
  FOR SELECT USING (bucket_id = 'communities');

-- 3. Enable authenticated file uploads for all buckets (INSERT Policies)
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload avatars" ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload covers" ON storage.objects;
CREATE POLICY "Users can upload covers" ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'covers');

DROP POLICY IF EXISTS "Users can upload posts" ON storage.objects;
CREATE POLICY "Users can upload posts" ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'posts');

DROP POLICY IF EXISTS "Users can upload stories" ON storage.objects;
CREATE POLICY "Users can upload stories" ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'stories');

DROP POLICY IF EXISTS "Users can upload reels" ON storage.objects;
CREATE POLICY "Users can upload reels" ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reels');

DROP POLICY IF EXISTS "Users can upload chat media" ON storage.objects;
CREATE POLICY "Users can upload chat media" ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat_media');

DROP POLICY IF EXISTS "Users can upload capsules" ON storage.objects;
CREATE POLICY "Users can upload capsules" ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'capsules');

DROP POLICY IF EXISTS "Users can upload communities" ON storage.objects;
CREATE POLICY "Users can upload communities" ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'communities');

-- 4. Enable file updates and deletes for avatars and covers (UPDATE/DELETE Policies)
DROP POLICY IF EXISTS "Users can update avatars" ON storage.objects;
CREATE POLICY "Users can update avatars" ON storage.objects 
  FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can update covers" ON storage.objects;
CREATE POLICY "Users can update covers" ON storage.objects 
  FOR UPDATE TO authenticated USING (bucket_id = 'covers');

DROP POLICY IF EXISTS "Users can delete avatars" ON storage.objects;
CREATE POLICY "Users can delete avatars" ON storage.objects 
  FOR DELETE TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can delete covers" ON storage.objects;
CREATE POLICY "Users can delete covers" ON storage.objects 
  FOR DELETE TO authenticated USING (bucket_id = 'covers');
