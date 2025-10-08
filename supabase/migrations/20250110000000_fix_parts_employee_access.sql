-- Fix RLS policies to include magasin role for VN orders and accessories
-- Note: parts@benflismotors.com should have 'magasin' role according to latest migration

-- Update VN Orders SELECT policy to include magasin (if not already included)
DROP POLICY IF EXISTS "Authorized users can view vn orders" ON public.vn_orders;

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
    has_role(auth.uid(), 'immatriculation') OR
    has_role(auth.uid(), 'magasin')
  );

-- Update VN Order Accessories SELECT policy to include magasin
DROP POLICY IF EXISTS "Authorized users can view order accessories" ON public.vn_order_accessories;

CREATE POLICY "Authorized users can view order accessories"
ON public.vn_order_accessories
FOR SELECT
USING (
  has_role(auth.uid(), 'sys_admin'::app_role) OR
  has_role(auth.uid(), 'director'::app_role) OR
  has_role(auth.uid(), 'cdv'::app_role) OR
  has_role(auth.uid(), 'commercial'::app_role) OR
  has_role(auth.uid(), 'magasin'::app_role)
);

-- Update Accessories SELECT policy to include magasin
DROP POLICY IF EXISTS "Authorized users can view accessories" ON public.accessories;

CREATE POLICY "Authorized users can view accessories"
  ON public.accessories FOR SELECT
  USING (
    has_role(auth.uid(), 'sys_admin') OR
    has_role(auth.uid(), 'director') OR
    has_role(auth.uid(), 'cdv') OR
    has_role(auth.uid(), 'commercial') OR
    has_role(auth.uid(), 'magasin')
  );
