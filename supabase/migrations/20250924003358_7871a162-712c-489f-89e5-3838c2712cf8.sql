-- Create an admin user account
-- First, we need to insert into auth.users (this will be handled by Supabase)
-- Then create the profile

-- Insert admin profile (assuming the auth user will be created separately)
-- For now, let's create a function that can be used to create an admin user

-- Create a function to setup admin user
CREATE OR REPLACE FUNCTION create_admin_user(
  admin_email TEXT,
  admin_password TEXT,
  admin_full_name TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- This function would need to be called through the Supabase dashboard
  -- For now, let's just return instructions
  RETURN 'Admin setup function created. Use Supabase Auth to create user: ' || admin_email;
END;
$$;

-- For immediate setup, let's create a temporary admin profile that can be linked later
-- Insert a profile that will be linked when the admin user signs up
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@benflismotors.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "System Administrator"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);