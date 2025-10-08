-- Fix Admin Role Assignment
-- This script will assign the sys_admin role to the admin user

-- First, let's check what users exist and their current roles
SELECT 
    u.id,
    u.email,
    ur.role,
    ur.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@benflismotors.com'
ORDER BY ur.created_at DESC;

-- If the admin user doesn't have sys_admin role, assign it
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'sys_admin'::app_role
FROM auth.users u
WHERE u.email = 'admin@benflismotors.com'
AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = u.id AND ur.role = 'sys_admin'
);

-- Also assign director role if needed
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'director'::app_role
FROM auth.users u
WHERE u.email = 'admin@benflismotors.com'
AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = u.id AND ur.role = 'director'
);

-- Verify the roles were assigned
SELECT 
    u.email,
    ur.role,
    ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@benflismotors.com'
ORDER BY ur.created_at DESC;
