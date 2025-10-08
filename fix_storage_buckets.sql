-- Fix storage buckets creation to handle existing buckets
-- This will only create buckets if they don't exist

-- Create storage buckets for file uploads (only if they don't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('repair-images', 'repair-images', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('excel-files', 'excel-files', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for repair images
CREATE POLICY "Repair employees can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'repair-images' AND
    public.get_current_user_role() IN ('repair_creator', 'admin')
  );

CREATE POLICY "Repair employees can view images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'repair-images' AND
    public.get_current_user_role() IN ('repair_creator', 'repair_pricer', 'admin')
  );

-- Create storage policies for excel files
CREATE POLICY "Visit and reseller managers can upload excel files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'excel-files' AND
    public.get_current_user_role() IN ('visit_manager', 'reseller_manager', 'admin')
  );

CREATE POLICY "Visit and reseller managers can view excel files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'excel-files' AND
    public.get_current_user_role() IN ('visit_manager', 'reseller_manager', 'admin')
  );

-- Create storage policies for invoices
CREATE POLICY "Parts employees can upload invoices" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'invoices' AND
    public.get_current_user_role() IN ('parts_employee', 'admin')
  );

CREATE POLICY "Parts employees can view invoices" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoices' AND
    public.get_current_user_role() IN ('parts_employee', 'admin')
  );


