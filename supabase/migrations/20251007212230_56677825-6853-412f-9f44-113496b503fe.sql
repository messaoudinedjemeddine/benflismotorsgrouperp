-- Drop existing enum and create new one with updated roles
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM (
  'sys_admin',
  'director',
  'cdv',
  'commercial',
  'magasin',
  'apv',
  'ged',
  'adv',
  'livraison',
  'immatriculation'
);

-- Recreate user_roles table with new enum
DROP TABLE IF EXISTS public.user_roles CASCADE;
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Recreate security functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
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

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Update RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'sys_admin'));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'sys_admin'));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'sys_admin'));

-- Update RLS policies for all tables with new roles
-- Accessories
DROP POLICY IF EXISTS "VN users and admins can view accessories" ON public.accessories;
DROP POLICY IF EXISTS "VN users and admins can insert accessories" ON public.accessories;
DROP POLICY IF EXISTS "VN users and admins can update accessories" ON public.accessories;
DROP POLICY IF EXISTS "VN users and admins can delete accessories" ON public.accessories;

CREATE POLICY "Authorized users can view accessories"
  ON public.accessories FOR SELECT
  USING (
    has_role(auth.uid(), 'sys_admin') OR
    has_role(auth.uid(), 'director') OR
    has_role(auth.uid(), 'cdv') OR
    has_role(auth.uid(), 'commercial') OR
    has_role(auth.uid(), 'magasin')
  );

CREATE POLICY "Authorized users can insert accessories"
  ON public.accessories FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'sys_admin') OR
    has_role(auth.uid(), 'director') OR
    has_role(auth.uid(), 'magasin')
  );

CREATE POLICY "Authorized users can update accessories"
  ON public.accessories FOR UPDATE
  USING (
    has_role(auth.uid(), 'sys_admin') OR
    has_role(auth.uid(), 'director') OR
    has_role(auth.uid(), 'magasin')
  );

CREATE POLICY "Authorized users can delete accessories"
  ON public.accessories FOR DELETE
  USING (
    has_role(auth.uid(), 'sys_admin') OR
    has_role(auth.uid(), 'director') OR
    has_role(auth.uid(), 'magasin')
  );

-- VN Orders
DROP POLICY IF EXISTS "VN users and admins can view orders" ON public.vn_orders;
DROP POLICY IF EXISTS "VN users and admins can insert orders" ON public.vn_orders;
DROP POLICY IF EXISTS "VN users and admins can update orders" ON public.vn_orders;
DROP POLICY IF EXISTS "Only admins can delete orders" ON public.vn_orders;

CREATE POLICY "Authorized users can view vn orders"
  ON public.vn_orders FOR SELECT
  USING (
    has_role(auth.uid(), 'sys_admin') OR
    has_role(auth.uid(), 'director') OR
    has_role(auth.uid(), 'cdv') OR
    has_role(auth.uid(), 'commercial') OR
    has_role(auth.uid(), 'ged') OR
    has_role(auth.uid(), 'adv') OR
    has_role(auth.uid(), 'livraison') OR
    has_role(auth.uid(), 'immatriculation')
  );

CREATE POLICY "Authorized users can insert vn orders"
  ON public.vn_orders FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'sys_admin') OR
    has_role(auth.uid(), 'director') OR
    has_role(auth.uid(), 'cdv') OR
    has_role(auth.uid(), 'commercial')
  );

CREATE POLICY "Authorized users can update vn orders"
  ON public.vn_orders FOR UPDATE
  USING (
    has_role(auth.uid(), 'sys_admin') OR
    has_role(auth.uid(), 'director') OR
    has_role(auth.uid(), 'cdv') OR
    has_role(auth.uid(), 'commercial') OR
    has_role(auth.uid(), 'ged') OR
    has_role(auth.uid(), 'adv') OR
    has_role(auth.uid(), 'livraison') OR
    has_role(auth.uid(), 'immatriculation')
  );

CREATE POLICY "Only admins can delete vn orders"
  ON public.vn_orders FOR DELETE
  USING (has_role(auth.uid(), 'sys_admin'));

-- Parts Orders
DROP POLICY IF EXISTS "Parts employees and admins can view parts orders" ON public.parts_orders;
DROP POLICY IF EXISTS "Parts employees and admins can insert parts orders" ON public.parts_orders;
DROP POLICY IF EXISTS "Parts employees and admins can update parts orders" ON public.parts_orders;

CREATE POLICY "Authorized users can view parts orders"
  ON public.parts_orders FOR SELECT
  USING (
    has_role(auth.uid(), 'sys_admin') OR
    has_role(auth.uid(), 'director') OR
    has_role(auth.uid(), 'magasin')
  );

CREATE POLICY "Authorized users can insert parts orders"
  ON public.parts_orders FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'sys_admin') OR
    has_role(auth.uid(), 'director') OR
    has_role(auth.uid(), 'magasin')
  );

CREATE POLICY "Authorized users can update parts orders"
  ON public.parts_orders FOR UPDATE
  USING (
    has_role(auth.uid(), 'sys_admin') OR
    has_role(auth.uid(), 'director') OR
    has_role(auth.uid(), 'magasin')
  );

-- Repair Orders
DROP POLICY IF EXISTS "Repair employees and admins can view repair orders" ON public.repair_orders;
DROP POLICY IF EXISTS "Repair creators and admins can insert repair orders" ON public.repair_orders;
DROP POLICY IF EXISTS "Repair employees and admins can update repair orders" ON public.repair_orders;

CREATE POLICY "Authorized users can view repair orders"
  ON public.repair_orders FOR SELECT
  USING (
    has_role(auth.uid(), 'sys_admin') OR
    has_role(auth.uid(), 'director') OR
    has_role(auth.uid(), 'apv')
  );

CREATE POLICY "Authorized users can insert repair orders"
  ON public.repair_orders FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'sys_admin') OR
    has_role(auth.uid(), 'director') OR
    has_role(auth.uid(), 'apv')
  );

CREATE POLICY "Authorized users can update repair orders"
  ON public.repair_orders FOR UPDATE
  USING (
    has_role(auth.uid(), 'sys_admin') OR
    has_role(auth.uid(), 'director') OR
    has_role(auth.uid(), 'apv')
  );

-- Resellers
DROP POLICY IF EXISTS "Reseller managers and admins can view resellers" ON public.resellers;
DROP POLICY IF EXISTS "Reseller managers and admins can insert resellers" ON public.resellers;
DROP POLICY IF EXISTS "Reseller managers and admins can update resellers" ON public.resellers;

CREATE POLICY "Authorized users can view resellers"
  ON public.resellers FOR SELECT
  USING (
    has_role(auth.uid(), 'sys_admin') OR
    has_role(auth.uid(), 'director') OR
    has_role(auth.uid(), 'magasin')
  );

CREATE POLICY "Authorized users can insert resellers"
  ON public.resellers FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'sys_admin') OR
    has_role(auth.uid(), 'director') OR
    has_role(auth.uid(), 'magasin')
  );

CREATE POLICY "Authorized users can update resellers"
  ON public.resellers FOR UPDATE
  USING (
    has_role(auth.uid(), 'sys_admin') OR
    has_role(auth.uid(), 'director') OR
    has_role(auth.uid(), 'magasin')
  );

-- Support Tickets (all authenticated users)
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON public.support_tickets;

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