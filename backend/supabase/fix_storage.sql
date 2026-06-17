-- 1. Create the storage buckets (Safe Insert)
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('capsules', 'capsules', true),
  ('communities', 'communities', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to prevent conflict errors
DROP POLICY IF EXISTS "Capsule images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload capsules" ON storage.objects;
DROP POLICY IF EXISTS "Community images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload communities" ON storage.objects;

-- 3. Create SELECT policies to allow public reading of images
CREATE POLICY "Capsule images are publicly accessible" 
ON storage.objects FOR SELECT USING (bucket_id = 'capsules');

CREATE POLICY "Community images are publicly accessible" 
ON storage.objects FOR SELECT USING (bucket_id = 'communities');

-- 4. Create INSERT policies to allow logged-in users to upload files
CREATE POLICY "Users can upload capsules" 
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'capsules');

CREATE POLICY "Users can upload communities" 
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'communities');
