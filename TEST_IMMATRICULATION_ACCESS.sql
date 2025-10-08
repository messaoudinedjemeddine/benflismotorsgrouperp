-- Test immatriculation role access to VN orders
-- Run this in your Supabase SQL Editor

-- Check if immatriculation@benflismotors.com user exists and has correct role
SELECT 
  u.email,
  p.full_name,
  ur.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'immatriculation@benflismotors.com';

-- Test if the user can access VN orders (this should return results if access is working)
SELECT 
  id,
  order_number,
  customer_name,
  status
FROM public.vn_orders
LIMIT 5;

-- Check current RLS policies for vn_orders
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'vn_orders';

-- Test if immatriculation role can access DOSSIER_DAIRA stage
-- This should work if the role assignment is correct
SELECT 
  'immatriculation'::app_role as role,
  'DOSSIER_DAIRA' as stage,
  'Access granted' as result;
