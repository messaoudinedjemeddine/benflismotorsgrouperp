-- Manual bucket creation script
-- Run this directly in your Supabase SQL Editor

-- Step 1: Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vn-order-documents', 'vn-order-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create policies
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

-- Step 3: Verify bucket was created
SELECT id, name, public FROM storage.buckets WHERE id = 'vn-order-documents';
