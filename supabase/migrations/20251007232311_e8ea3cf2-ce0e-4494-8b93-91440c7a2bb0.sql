-- Add policies for sys_admin to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'sys_admin'::app_role));

-- Add policy for sys_admin to view all user roles
CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'sys_admin'::app_role));

-- Add policy for sys_admin to update any profile
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'sys_admin'::app_role));

-- The insert and update policies for user_roles already exist for sys_admin