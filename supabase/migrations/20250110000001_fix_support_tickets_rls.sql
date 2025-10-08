-- Fix RLS policies for support tickets to use correct role names
-- The issue is that the policies are using 'admin' instead of 'sys_admin'

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON public.support_tickets;

-- Create new policies with correct role names
CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets FOR SELECT
  USING (
    has_role(auth.uid(), 'sys_admin') OR
    has_role(auth.uid(), 'director')
  );

CREATE POLICY "Admins can update all tickets"
  ON public.support_tickets FOR UPDATE
  USING (
    has_role(auth.uid(), 'sys_admin') OR
    has_role(auth.uid(), 'director')
  );
