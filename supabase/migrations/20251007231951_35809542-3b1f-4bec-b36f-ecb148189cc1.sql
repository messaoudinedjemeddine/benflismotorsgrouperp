-- Update the handle_new_user function to use new role names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  assigned_role app_role;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  
  -- Assign role based on email - using NEW role names
  assigned_role := CASE 
    WHEN NEW.email = 'admin@benflismotors.com' THEN 'sys_admin'::app_role
    WHEN NEW.email = 'director@benflismotors.com' THEN 'director'::app_role
    WHEN NEW.email = 'cdv@benflismotors.com' THEN 'cdv'::app_role
    WHEN NEW.email = 'commercial@benflismotors.com' THEN 'commercial'::app_role
    WHEN NEW.email = 'magasin@benflismotors.com' THEN 'magasin'::app_role
    WHEN NEW.email = 'apv@benflismotors.com' THEN 'apv'::app_role
    WHEN NEW.email = 'ged@benflismotors.com' THEN 'ged'::app_role
    WHEN NEW.email = 'adv@benflismotors.com' THEN 'adv'::app_role
    WHEN NEW.email = 'livraison@benflismotors.com' THEN 'livraison'::app_role
    WHEN NEW.email = 'immatriculation@benflismotors.com' THEN 'immatriculation'::app_role
    -- Old emails for backward compatibility
    WHEN NEW.email = 'parts@benflismotors.com' THEN 'magasin'::app_role
    WHEN NEW.email = 'repair@benflismotors.com' THEN 'apv'::app_role
    WHEN NEW.email = 'pricer@benflismotors.com' THEN 'apv'::app_role
    WHEN NEW.email = 'visits@benflismotors.com' THEN 'cdv'::app_role
    WHEN NEW.email = 'resellers@benflismotors.com' THEN 'magasin'::app_role
    WHEN NEW.email = 'vn@benflismotors.com' THEN 'cdv'::app_role
    ELSE 'cdv'::app_role
  END;
  
  -- Insert role into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);
  
  RETURN NEW;
END;
$function$;