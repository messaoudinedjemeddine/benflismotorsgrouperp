-- Update the existing admin user to have admin role
UPDATE profiles 
SET role = 'admin'
WHERE email = 'admin@benflismotors.com';