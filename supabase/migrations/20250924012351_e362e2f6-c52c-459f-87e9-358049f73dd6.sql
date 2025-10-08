-- Update handle_new_user function to assign roles based on email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    CASE 
      WHEN NEW.email = 'admin@benflismotors.com' THEN 'admin'::user_role
      WHEN NEW.email = 'parts@benflismotors.com' THEN 'parts_employee'::user_role
      WHEN NEW.email = 'repair@benflismotors.com' THEN 'repair_creator'::user_role
      WHEN NEW.email = 'pricer@benflismotors.com' THEN 'repair_pricer'::user_role
      WHEN NEW.email = 'visits@benflismotors.com' THEN 'visit_manager'::user_role
      WHEN NEW.email = 'resellers@benflismotors.com' THEN 'reseller_manager'::user_role
      ELSE 'parts_employee'::user_role
    END
  );
  RETURN NEW;
END;
$$;

-- Create the trigger to call handle_new_user when a user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();