-- Migration 007: Alter audio_track_id to TEXT type
-- Drops the foreign key constraints linking to audio_tracks(id) since audio tracks are matched client-side via static keys.

-- 1. Drop foreign keys
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS fk_stories_audio;
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS fk_posts_audio;
ALTER TABLE public.reels DROP CONSTRAINT IF EXISTS fk_reels_audio;

-- 2. Alter column types to TEXT
ALTER TABLE public.stories ALTER COLUMN audio_track_id TYPE TEXT USING audio_track_id::text;
ALTER TABLE public.posts ALTER COLUMN audio_track_id TYPE TEXT USING audio_track_id::text;
ALTER TABLE public.reels ALTER COLUMN audio_track_id TYPE TEXT USING audio_track_id::text;
