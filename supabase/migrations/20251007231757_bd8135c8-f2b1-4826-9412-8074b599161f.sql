-- First, delete orphaned profiles (users that don't exist in auth.users)
DELETE FROM public.profiles
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Convert the role column to text to avoid enum issues
ALTER TABLE public.profiles ALTER COLUMN role TYPE text;

-- Now migrate the data to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT 
  user_id,
  CASE 
    WHEN role = 'parts_employee' THEN 'magasin'::app_role
    WHEN role = 'repair_creator' THEN 'apv'::app_role
    WHEN role = 'repair_pricer' THEN 'apv'::app_role
    WHEN role = 'visit_manager' THEN 'cdv'::app_role
    WHEN role = 'reseller_manager' THEN 'magasin'::app_role
    WHEN role = 'vn' THEN 'cdv'::app_role
    WHEN role = 'admin' THEN 'sys_admin'::app_role
    ELSE 'cdv'::app_role
  END
FROM public.profiles
WHERE user_id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove the old role column from profiles table
ALTER TABLE public.profiles DROP COLUMN role;

-- Drop the old user_role enum if it exists
DROP TYPE IF EXISTS public.user_role CASCADE;