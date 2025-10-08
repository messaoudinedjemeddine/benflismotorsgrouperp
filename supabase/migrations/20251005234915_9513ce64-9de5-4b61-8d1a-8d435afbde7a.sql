-- CRITICAL SECURITY FIX: Move roles to separate table (correct order)

-- Step 1: Create new role enum with VN role
CREATE TYPE public.app_role AS ENUM ('admin', 'parts_employee', 'repair_creator', 'repair_pricer', 'visit_manager', 'reseller_manager', 'vn');

-- Step 2: Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Step 3: Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Step 5: Create helper function to get user's roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

-- Step 6: Migrate existing roles from profiles to user_roles (ONLY for real auth users)
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, p.role::text::app_role
FROM public.profiles p
WHERE p.role IS NOT NULL
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = p.user_id);

-- Step 7: Update RLS policies on user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Step 8: DROP ALL OLD POLICIES FIRST (before dropping old function)
DROP POLICY IF EXISTS "Parts employees and admins can view parts orders" ON public.parts_orders;
DROP POLICY IF EXISTS "Parts employees and admins can insert parts orders" ON public.parts_orders;
DROP POLICY IF EXISTS "Parts employees and admins can update parts orders" ON public.parts_orders;
DROP POLICY IF EXISTS "Parts employees and admins can view order pieces" ON public.order_pieces;
DROP POLICY IF EXISTS "Parts employees and admins can insert order pieces" ON public.order_pieces;
DROP POLICY IF EXISTS "Parts employees and admins can update order pieces" ON public.order_pieces;
DROP POLICY IF EXISTS "Repair employees and admins can view repair orders" ON public.repair_orders;
DROP POLICY IF EXISTS "Repair creators and admins can insert repair orders" ON public.repair_orders;
DROP POLICY IF EXISTS "Repair employees and admins can update repair orders" ON public.repair_orders;
DROP POLICY IF EXISTS "Repair employees and admins can view repair images" ON public.repair_images;
DROP POLICY IF EXISTS "Repair creators and admins can insert repair images" ON public.repair_images;
DROP POLICY IF EXISTS "Visit managers and admins can view client visits" ON public.client_visits;
DROP POLICY IF EXISTS "Visit managers and admins can insert client visits" ON public.client_visits;
DROP POLICY IF EXISTS "Visit managers and admins can update client visits" ON public.client_visits;
DROP POLICY IF EXISTS "Reseller managers and admins can view resellers" ON public.resellers;
DROP POLICY IF EXISTS "Reseller managers and admins can insert resellers" ON public.resellers;
DROP POLICY IF EXISTS "Reseller managers and admins can update resellers" ON public.resellers;
DROP POLICY IF EXISTS "Reseller managers and admins can view promo campaigns" ON public.promo_campaigns;
DROP POLICY IF EXISTS "Reseller managers and admins can insert promo campaigns" ON public.promo_campaigns;
DROP POLICY IF EXISTS "Reseller managers and admins can view campaign resellers" ON public.campaign_resellers;
DROP POLICY IF EXISTS "Reseller managers and admins can insert campaign resellers" ON public.campaign_resellers;
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can view cars" ON public.cars;
DROP POLICY IF EXISTS "Authenticated users can insert cars" ON public.cars;
DROP POLICY IF EXISTS "Authenticated users can update cars" ON public.cars;

-- Storage policies
DROP POLICY IF EXISTS "Repair employees can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Repair employees can view images" ON storage.objects;
DROP POLICY IF EXISTS "Visit and reseller managers can upload excel files" ON storage.objects;
DROP POLICY IF EXISTS "Visit and reseller managers can view excel files" ON storage.objects;
DROP POLICY IF EXISTS "Parts employees can upload invoices" ON storage.objects;
DROP POLICY IF EXISTS "Parts employees can view invoices" ON storage.objects;

-- Step 9: NOW drop and recreate get_current_user_role function
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Step 10: Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role app_role;
BEGIN
  -- Create profile without role
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  
  -- Assign role based on email
  assigned_role := CASE 
    WHEN NEW.email = 'admin@benflismotors.com' THEN 'admin'::app_role
    WHEN NEW.email = 'parts@benflismotors.com' THEN 'parts_employee'::app_role
    WHEN NEW.email = 'repair@benflismotors.com' THEN 'repair_creator'::app_role
    WHEN NEW.email = 'pricer@benflismotors.com' THEN 'repair_pricer'::app_role
    WHEN NEW.email = 'visits@benflismotors.com' THEN 'visit_manager'::app_role
    WHEN NEW.email = 'resellers@benflismotors.com' THEN 'reseller_manager'::app_role
    WHEN NEW.email = 'vn@benflismotors.com' THEN 'vn'::app_role
    ELSE 'parts_employee'::app_role
  END;
  
  -- Insert role into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);
  
  RETURN NEW;
END;
$$;

-- Step 11: Recreate ALL policies with new has_role function

-- Parts Orders
CREATE POLICY "Parts employees and admins can view parts orders"
ON public.parts_orders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'parts_employee') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Parts employees and admins can insert parts orders"
ON public.parts_orders FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'parts_employee') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Parts employees and admins can update parts orders"
ON public.parts_orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'parts_employee') OR public.has_role(auth.uid(), 'admin'));

-- Order Pieces
CREATE POLICY "Parts employees and admins can view order pieces"
ON public.order_pieces FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'parts_employee') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Parts employees and admins can insert order pieces"
ON public.order_pieces FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'parts_employee') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Parts employees and admins can update order pieces"
ON public.order_pieces FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'parts_employee') OR public.has_role(auth.uid(), 'admin'));

-- Repair Orders
CREATE POLICY "Repair employees and admins can view repair orders"
ON public.repair_orders FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'repair_creator') OR 
  public.has_role(auth.uid(), 'repair_pricer') OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Repair creators and admins can insert repair orders"
ON public.repair_orders FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'repair_creator') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Repair employees and admins can update repair orders"
ON public.repair_orders FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'repair_creator') OR 
  public.has_role(auth.uid(), 'repair_pricer') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Repair Images
CREATE POLICY "Repair employees and admins can view repair images"
ON public.repair_images FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'repair_creator') OR 
  public.has_role(auth.uid(), 'repair_pricer') OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Repair creators and admins can insert repair images"
ON public.repair_images FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'repair_creator') OR public.has_role(auth.uid(), 'admin'));

-- Client Visits
CREATE POLICY "Visit managers and admins can view client visits"
ON public.client_visits FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'visit_manager') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Visit managers and admins can insert client visits"
ON public.client_visits FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'visit_manager') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Visit managers and admins can update client visits"
ON public.client_visits FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'visit_manager') OR public.has_role(auth.uid(), 'admin'));

-- Resellers
CREATE POLICY "Reseller managers and admins can view resellers"
ON public.resellers FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'reseller_manager') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Reseller managers and admins can insert resellers"
ON public.resellers FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'reseller_manager') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Reseller managers and admins can update resellers"
ON public.resellers FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'reseller_manager') OR public.has_role(auth.uid(), 'admin'));

-- Promo Campaigns
CREATE POLICY "Reseller managers and admins can view promo campaigns"
ON public.promo_campaigns FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'reseller_manager') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Reseller managers and admins can insert promo campaigns"
ON public.promo_campaigns FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'reseller_manager') OR public.has_role(auth.uid(), 'admin'));

-- Campaign Resellers
CREATE POLICY "Reseller managers and admins can view campaign resellers"
ON public.campaign_resellers FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'reseller_manager') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Reseller managers and admins can insert campaign resellers"
ON public.campaign_resellers FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'reseller_manager') OR public.has_role(auth.uid(), 'admin'));

-- Clients (FIX SECURITY ISSUE: Restrict to relevant roles only)
CREATE POLICY "Authorized roles can view clients"
ON public.clients FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'parts_employee') OR
  public.has_role(auth.uid(), 'repair_creator') OR
  public.has_role(auth.uid(), 'repair_pricer') OR
  public.has_role(auth.uid(), 'visit_manager')
);

CREATE POLICY "Authorized roles can insert clients"
ON public.clients FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'parts_employee') OR
  public.has_role(auth.uid(), 'repair_creator') OR
  public.has_role(auth.uid(), 'repair_pricer') OR
  public.has_role(auth.uid(), 'visit_manager')
);

CREATE POLICY "Authorized roles can update clients"
ON public.clients FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'parts_employee') OR
  public.has_role(auth.uid(), 'repair_creator') OR
  public.has_role(auth.uid(), 'repair_pricer') OR
  public.has_role(auth.uid(), 'visit_manager')
);

-- Cars
CREATE POLICY "Authorized roles can view cars"
ON public.cars FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'parts_employee') OR
  public.has_role(auth.uid(), 'repair_creator') OR
  public.has_role(auth.uid(), 'repair_pricer') OR
  public.has_role(auth.uid(), 'visit_manager')
);

CREATE POLICY "Authorized roles can insert cars"
ON public.cars FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'parts_employee') OR
  public.has_role(auth.uid(), 'repair_creator') OR
  public.has_role(auth.uid(), 'repair_pricer') OR
  public.has_role(auth.uid(), 'visit_manager')
);

CREATE POLICY "Authorized roles can update cars"
ON public.cars FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'parts_employee') OR
  public.has_role(auth.uid(), 'repair_creator') OR
  public.has_role(auth.uid(), 'repair_pricer') OR
  public.has_role(auth.uid(), 'visit_manager')
);

-- Storage policies
CREATE POLICY "Repair employees can upload images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'repair-images' AND
  (public.has_role(auth.uid(), 'repair_creator') OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Repair employees can view images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'repair-images' AND
  (public.has_role(auth.uid(), 'repair_creator') OR 
   public.has_role(auth.uid(), 'repair_pricer') OR 
   public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Visit and reseller managers can upload excel files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'excel-files' AND
  (public.has_role(auth.uid(), 'visit_manager') OR 
   public.has_role(auth.uid(), 'reseller_manager') OR 
   public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Visit and reseller managers can view excel files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'excel-files' AND
  (public.has_role(auth.uid(), 'visit_manager') OR 
   public.has_role(auth.uid(), 'reseller_manager') OR 
   public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Parts employees can upload invoices"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'invoices' AND
  (public.has_role(auth.uid(), 'parts_employee') OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Parts employees can view invoices"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'invoices' AND
  (public.has_role(auth.uid(), 'parts_employee') OR public.has_role(auth.uid(), 'admin'))
);