-- Create accessories table
CREATE TABLE public.accessories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  price_ht NUMERIC NOT NULL CHECK (price_ht >= 0),
  price_ttc NUMERIC GENERATED ALWAYS AS (price_ht * 1.19) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vn_order_accessories junction table
CREATE TABLE public.vn_order_accessories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.vn_orders(id) ON DELETE CASCADE,
  accessory_id UUID NOT NULL REFERENCES public.accessories(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id, accessory_id)
);

-- Enable RLS
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vn_order_accessories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accessories
CREATE POLICY "VN users and admins can view accessories"
  ON public.accessories FOR SELECT
  USING (has_role(auth.uid(), 'vn'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "VN users and admins can insert accessories"
  ON public.accessories FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'vn'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "VN users and admins can update accessories"
  ON public.accessories FOR UPDATE
  USING (has_role(auth.uid(), 'vn'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "VN users and admins can delete accessories"
  ON public.accessories FOR DELETE
  USING (has_role(auth.uid(), 'vn'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for vn_order_accessories
CREATE POLICY "VN users and admins can view order accessories"
  ON public.vn_order_accessories FOR SELECT
  USING (has_role(auth.uid(), 'vn'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "VN users and admins can insert order accessories"
  ON public.vn_order_accessories FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'vn'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "VN users and admins can update order accessories"
  ON public.vn_order_accessories FOR UPDATE
  USING (has_role(auth.uid(), 'vn'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "VN users and admins can delete order accessories"
  ON public.vn_order_accessories FOR DELETE
  USING (has_role(auth.uid(), 'vn'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_accessories_updated_at
  BEFORE UPDATE ON public.accessories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();