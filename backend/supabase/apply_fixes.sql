-- STORYBRIDGE COMBINED DATABASE SETUP & REPAIR SQL SCRIPT
-- Paste this script into your Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new) and click "Run".

----------------------------------------------------
-- PART 1: ALIGN AUDIO TRACK ID COLUMNS (UUID to TEXT)
----------------------------------------------------
-- Drops the foreign key constraints linking to audio_tracks(id) since audio tracks are matched client-side via static keys.

-- 1. Drop foreign keys if they exist
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS fk_stories_audio;
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS fk_posts_audio;
ALTER TABLE public.reels DROP CONSTRAINT IF EXISTS fk_reels_audio;

-- 2. Alter column types to TEXT to support string audio track IDs (e.g., 'synthwave-drive')
ALTER TABLE public.stories ALTER COLUMN audio_track_id TYPE TEXT USING audio_track_id::text;
ALTER TABLE public.posts ALTER COLUMN audio_track_id TYPE TEXT USING audio_track_id::text;
ALTER TABLE public.reels ALTER COLUMN audio_track_id TYPE TEXT USING audio_track_id::text;

----------------------------------------------------
-- PART 2: CREATE ALL STORAGE BUCKETS (Safe Insert)
----------------------------------------------------
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

----------------------------------------------------
-- PART 3: ENABLE PUBLIC READ ACCESS (SELECT Policies)
----------------------------------------------------
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

----------------------------------------------------
-- PART 4: ENABLE AUTHENTICATED UPLOADS (INSERT Policies)
----------------------------------------------------
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

----------------------------------------------------
-- PART 5: ENABLE FILE UPDATES & DELETES (UPDATE/DELETE Policies)
----------------------------------------------------
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

----------------------------------------------------
-- PART 6: RELOAD PGRST CACHE TO APPLY ALTERS INSTANTLY
----------------------------------------------------
NOTIFY pgrst, 'reload schema';
