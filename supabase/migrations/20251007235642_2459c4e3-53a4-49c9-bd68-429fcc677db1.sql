-- Update RLS policies for vn_order_accessories to remove magasin from INSERT, UPDATE, DELETE

-- Drop existing policies
DROP POLICY IF EXISTS "Authorized users can insert order accessories" ON vn_order_accessories;
DROP POLICY IF EXISTS "Authorized users can update order accessories" ON vn_order_accessories;
DROP POLICY IF EXISTS "Authorized users can delete order accessories" ON vn_order_accessories;

-- Recreate INSERT policy without magasin
CREATE POLICY "Authorized users can insert order accessories"
ON vn_order_accessories
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'sys_admin'::app_role) OR
  has_role(auth.uid(), 'director'::app_role) OR
  has_role(auth.uid(), 'cdv'::app_role) OR
  has_role(auth.uid(), 'commercial'::app_role)
);

-- Recreate UPDATE policy without magasin
CREATE POLICY "Authorized users can update order accessories"
ON vn_order_accessories
FOR UPDATE
USING (
  has_role(auth.uid(), 'sys_admin'::app_role) OR
  has_role(auth.uid(), 'director'::app_role) OR
  has_role(auth.uid(), 'cdv'::app_role) OR
  has_role(auth.uid(), 'commercial'::app_role)
);

-- Recreate DELETE policy without magasin
CREATE POLICY "Authorized users can delete order accessories"
ON vn_order_accessories
FOR DELETE
USING (
  has_role(auth.uid(), 'sys_admin'::app_role) OR
  has_role(auth.uid(), 'director'::app_role) OR
  has_role(auth.uid(), 'cdv'::app_role) OR
  has_role(auth.uid(), 'commercial'::app_role)
);