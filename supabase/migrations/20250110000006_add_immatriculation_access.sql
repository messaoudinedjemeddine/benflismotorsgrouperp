-- Add immatriculation role access to VN orders
-- This allows immatriculation@benflismotors.com to access and complete DOSSIER_DAIRA stage

-- Update VN Orders SELECT policy to include immatriculation
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

-- Update VN Orders UPDATE policy to include immatriculation
DROP POLICY IF EXISTS "Authorized users can update vn orders" ON public.vn_orders;

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
    has_role(auth.uid(), 'immatriculation') OR
    has_role(auth.uid(), 'magasin')
  );

-- Update VN Order Documents SELECT policy to include immatriculation
DROP POLICY IF EXISTS "Authorized users can view order documents" ON public.vn_order_documents;

CREATE POLICY "Authorized users can view order documents"
  ON public.vn_order_documents FOR SELECT
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

-- Update VN Order Documents INSERT policy to include immatriculation
DROP POLICY IF EXISTS "Authorized users can insert order documents" ON public.vn_order_documents;

CREATE POLICY "Authorized users can insert order documents"
  ON public.vn_order_documents FOR INSERT
  WITH CHECK (
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
