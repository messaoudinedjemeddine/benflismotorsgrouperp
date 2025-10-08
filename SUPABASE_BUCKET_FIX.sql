-- URGENT: Run this in your Supabase SQL Editor to fix the bucket issue
-- Copy and paste this entire script into your Supabase SQL Editor

-- Step 1: Create the bucket manually
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vn-order-documents',
  'vn-order-documents', 
  true,
  52428800,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

-- Step 2: Drop any existing policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated downloads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Step 3: Create new policies
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vn-order-documents');

CREATE POLICY "Allow authenticated downloads" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'vn-order-documents');

CREATE POLICY "Allow authenticated updates" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'vn-order-documents');

CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'vn-order-documents');

-- Step 4: Verify the bucket exists
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'vn-order-documents';

-- Step 5: Test bucket access (this should return empty array, not error)
SELECT * FROM storage.objects WHERE bucket_id = 'vn-order-documents' LIMIT 1;
