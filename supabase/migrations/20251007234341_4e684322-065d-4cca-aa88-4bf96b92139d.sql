-- Enable RLS on vn_order_accessories if not already enabled
ALTER TABLE vn_order_accessories ENABLE ROW LEVEL SECURITY;

-- Allow authorized users to view order accessories
CREATE POLICY "Authorized users can view order accessories"
ON vn_order_accessories
FOR SELECT
USING (
  has_role(auth.uid(), 'sys_admin'::app_role) OR
  has_role(auth.uid(), 'director'::app_role) OR
  has_role(auth.uid(), 'cdv'::app_role) OR
  has_role(auth.uid(), 'commercial'::app_role) OR
  has_role(auth.uid(), 'magasin'::app_role)
);

-- Allow authorized users to insert order accessories
CREATE POLICY "Authorized users can insert order accessories"
ON vn_order_accessories
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'sys_admin'::app_role) OR
  has_role(auth.uid(), 'director'::app_role) OR
  has_role(auth.uid(), 'cdv'::app_role) OR
  has_role(auth.uid(), 'commercial'::app_role) OR
  has_role(auth.uid(), 'magasin'::app_role)
);

-- Allow authorized users to update order accessories
CREATE POLICY "Authorized users can update order accessories"
ON vn_order_accessories
FOR UPDATE
USING (
  has_role(auth.uid(), 'sys_admin'::app_role) OR
  has_role(auth.uid(), 'director'::app_role) OR
  has_role(auth.uid(), 'cdv'::app_role) OR
  has_role(auth.uid(), 'commercial'::app_role) OR
  has_role(auth.uid(), 'magasin'::app_role)
);

-- Allow authorized users to delete order accessories
CREATE POLICY "Authorized users can delete order accessories"
ON vn_order_accessories
FOR DELETE
USING (
  has_role(auth.uid(), 'sys_admin'::app_role) OR
  has_role(auth.uid(), 'director'::app_role) OR
  has_role(auth.uid(), 'cdv'::app_role) OR
  has_role(auth.uid(), 'commercial'::app_role) OR
  has_role(auth.uid(), 'magasin'::app_role)
);