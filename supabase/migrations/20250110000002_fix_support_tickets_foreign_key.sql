-- Fix foreign key relationship for support_tickets to profiles
-- The issue is that support_tickets.user_id references auth.users(id)
-- but we need to ensure the relationship with profiles is properly established

-- First, let's check if we need to add a foreign key constraint
-- Since support_tickets.user_id references auth.users(id) and profiles.user_id also references auth.users(id)
-- we can create a view or use a different approach

-- Create a view that joins support_tickets with profiles
CREATE OR REPLACE VIEW public.support_tickets_with_profiles AS
SELECT 
  st.*,
  p.full_name,
  p.email as profile_email
FROM public.support_tickets st
LEFT JOIN public.profiles p ON st.user_id = p.user_id;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.support_tickets_with_profiles TO authenticated;

-- Update RLS policies to include the view
CREATE POLICY "Admins can view support tickets with profiles"
  ON public.support_tickets_with_profiles FOR SELECT
  USING (
    has_role(auth.uid(), 'sys_admin') OR
    has_role(auth.uid(), 'director')
  );
