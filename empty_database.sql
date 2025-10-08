-- Complete database cleanup script
-- This will remove all data and reset the database to a clean state

-- Drop all foreign key constraints first
ALTER TABLE IF EXISTS public.cars DROP CONSTRAINT IF EXISTS cars_client_id_fkey;
ALTER TABLE IF EXISTS public.parts_orders DROP CONSTRAINT IF EXISTS parts_orders_client_id_fkey;
ALTER TABLE IF EXISTS public.parts_orders DROP CONSTRAINT IF EXISTS parts_orders_car_id_fkey;
ALTER TABLE IF EXISTS public.order_pieces DROP CONSTRAINT IF EXISTS order_pieces_order_id_fkey;
ALTER TABLE IF EXISTS public.repair_orders DROP CONSTRAINT IF EXISTS repair_orders_client_id_fkey;
ALTER TABLE IF EXISTS public.repair_orders DROP CONSTRAINT IF EXISTS repair_orders_car_id_fkey;
ALTER TABLE IF EXISTS public.repair_images DROP CONSTRAINT IF EXISTS repair_images_repair_order_id_fkey;
ALTER TABLE IF EXISTS public.client_visits DROP CONSTRAINT IF EXISTS client_visits_client_id_fkey;
ALTER TABLE IF EXISTS public.client_visits DROP CONSTRAINT IF EXISTS client_visits_car_id_fkey;
ALTER TABLE IF EXISTS public.campaign_resellers DROP CONSTRAINT IF EXISTS campaign_resellers_campaign_id_fkey;
ALTER TABLE IF EXISTS public.campaign_resellers DROP CONSTRAINT IF EXISTS campaign_resellers_reseller_id_fkey;

-- Drop all triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
DROP TRIGGER IF EXISTS update_cars_updated_at ON public.cars;
DROP TRIGGER IF EXISTS update_parts_orders_updated_at ON public.parts_orders;
DROP TRIGGER IF EXISTS update_repair_orders_updated_at ON public.repair_orders;
DROP TRIGGER IF EXISTS update_client_visits_updated_at ON public.client_visits;
DROP TRIGGER IF EXISTS update_resellers_updated_at ON public.resellers;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop all policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can view cars" ON public.cars;
DROP POLICY IF EXISTS "Authenticated users can insert cars" ON public.cars;
DROP POLICY IF EXISTS "Authenticated users can update cars" ON public.cars;
DROP POLICY IF EXISTS "Parts employees and admins can view parts orders" ON public.parts_orders;
DROP POLICY IF EXISTS "Parts employees and admins can insert parts orders" ON public.parts_orders;
DROP POLICY IF EXISTS "Parts employees and admins can update parts orders" ON public.parts_orders;
DROP POLICY IF EXISTS "Parts employees and admins can view order pieces" ON public.order_pieces;
DROP POLICY IF EXISTS "Parts employees and admins can insert order pieces" ON public.order_pieces;
DROP POLICY IF EXISTS "Parts employees and admins can update order pieces" ON public.order_pieces;
DROP POLICY IF EXISTS "Repair employees and admins can view repair orders" ON public.repair_orders;
DROP POLICY IF EXISTS "Repair creators and admins can insert repair orders" ON public.repair_orders;
DROP POLICY IF EXISTS "Repair employees and admins can update repair orders" ON public.repair_orders;
DROP POLICY IF EXISTS "Repair employees and admins can view repair images" ON public.repair_images;
DROP POLICY IF EXISTS "Repair creators and admins can insert repair images" ON public.repair_images;
DROP POLICY IF EXISTS "Visit managers and admins can view client visits" ON public.client_visits;
DROP POLICY IF EXISTS "Visit managers and admins can insert client visits" ON public.client_visits;
DROP POLICY IF EXISTS "Visit managers and admins can update client visits" ON public.client_visits;
DROP POLICY IF EXISTS "Reseller managers and admins can view resellers" ON public.resellers;
DROP POLICY IF EXISTS "Reseller managers and admins can insert resellers" ON public.resellers;
DROP POLICY IF EXISTS "Reseller managers and admins can update resellers" ON public.resellers;
DROP POLICY IF EXISTS "Reseller managers and admins can view promo campaigns" ON public.promo_campaigns;
DROP POLICY IF EXISTS "Reseller managers and admins can insert promo campaigns" ON public.promo_campaigns;
DROP POLICY IF EXISTS "Reseller managers and admins can view campaign resellers" ON public.campaign_resellers;
DROP POLICY IF EXISTS "Reseller managers and admins can insert campaign resellers" ON public.campaign_resellers;

-- Drop storage policies
DROP POLICY IF EXISTS "Repair employees can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Repair employees can view images" ON storage.objects;
DROP POLICY IF EXISTS "Visit and reseller managers can upload excel files" ON storage.objects;
DROP POLICY IF EXISTS "Visit and reseller managers can view excel files" ON storage.objects;
DROP POLICY IF EXISTS "Parts employees can upload invoices" ON storage.objects;
DROP POLICY IF EXISTS "Parts employees can view invoices" ON storage.objects;

-- Drop all indexes
DROP INDEX IF EXISTS idx_profiles_user_id;
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_cars_client_id;
DROP INDEX IF EXISTS idx_parts_orders_client_id;
DROP INDEX IF EXISTS idx_parts_orders_status;
DROP INDEX IF EXISTS idx_parts_orders_created_at;
DROP INDEX IF EXISTS idx_order_pieces_order_id;
DROP INDEX IF EXISTS idx_repair_orders_status;
DROP INDEX IF EXISTS idx_repair_orders_created_at;
DROP INDEX IF EXISTS idx_client_visits_category;
DROP INDEX IF EXISTS idx_client_visits_last_visit_date;

-- Drop all tables (in correct order due to foreign key dependencies)
DROP TABLE IF EXISTS public.campaign_resellers CASCADE;
DROP TABLE IF EXISTS public.promo_campaigns CASCADE;
DROP TABLE IF EXISTS public.repair_images CASCADE;
DROP TABLE IF EXISTS public.order_pieces CASCADE;
DROP TABLE IF EXISTS public.parts_orders CASCADE;
DROP TABLE IF EXISTS public.repair_orders CASCADE;
DROP TABLE IF EXISTS public.client_visits CASCADE;
DROP TABLE IF EXISTS public.cars CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.resellers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS create_admin_user(TEXT, TEXT, TEXT);

-- Drop all custom types
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.repair_status CASCADE;
DROP TYPE IF EXISTS public.visit_category CASCADE;
DROP TYPE IF EXISTS public.communication_type CASCADE;

-- Drop storage buckets (optional - you might want to keep them)
-- DROP TABLE IF EXISTS storage.buckets CASCADE;
-- DROP TABLE IF EXISTS storage.objects CASCADE;

-- Clear any remaining data from auth tables (be careful with this)
-- TRUNCATE TABLE auth.users CASCADE;
-- TRUNCATE TABLE auth.identities CASCADE;
-- TRUNCATE TABLE auth.sessions CASCADE;
-- TRUNCATE TABLE auth.refresh_tokens CASCADE;
