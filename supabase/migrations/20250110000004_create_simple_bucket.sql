-- Create a simple storage bucket for documents
-- This is a fallback if the main bucket creation fails

-- First, try to create the bucket if it doesn't exist
DO $$
BEGIN
  -- Check if bucket exists
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'vn-order-documents') THEN
    -- Create the bucket
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('vn-order-documents', 'vn-order-documents', true);
    
    RAISE NOTICE 'Created vn-order-documents bucket';
  ELSE
    RAISE NOTICE 'vn-order-documents bucket already exists';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create vn-order-documents bucket: %', SQLERRM;
END $$;

-- Create basic policies for the bucket
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Allow uploads" ON storage.objects;
  DROP POLICY IF EXISTS "Allow downloads" ON storage.objects;
  
  -- Create simple policies
  CREATE POLICY "Allow uploads" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'vn-order-documents');
    
  CREATE POLICY "Allow downloads" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'vn-order-documents');
    
  RAISE NOTICE 'Created storage policies for vn-order-documents bucket';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create storage policies: %', SQLERRM;
END $$;
