-- Create VN Orders Management System (fixed enum name)

-- VN Order status enum (unique name to avoid conflicts)
CREATE TYPE public.vn_order_status AS ENUM (
  'INSCRIPTION',
  'PROFORMA',
  'COMMANDE',
  'VALIDATION',
  'ACCUSÉ',
  'FACTURATION',
  'ARRIVAGE',
  'CARTE_JAUNE',
  'LIVRAISON',
  'DOSSIER_DAIRA'
);

-- Order location enum
CREATE TYPE public.vn_order_location AS ENUM (
  'PARC1',
  'PARC2',
  'SHOWROOM'
);

-- Document type enum
CREATE TYPE public.vn_document_type AS ENUM (
  'PROFORMA_INVOICE',
  'CUSTOMER_ID',
  'PURCHASE_ORDER',
  'DELIVERY_NOTE',
  'FINAL_INVOICE',
  'OTHER'
);

-- Create vn_orders table
CREATE TABLE public.vn_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  
  -- Customer information
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_id_number TEXT,
  customer_address TEXT,
  
  -- Vehicle information
  vehicle_brand TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INTEGER,
  vehicle_vin TEXT,
  vehicle_color TEXT,
  vehicle_avaries TEXT,
  vehicle_features TEXT[],
  
  -- Financial information
  total_price NUMERIC NOT NULL DEFAULT 0,
  advance_payment NUMERIC NOT NULL DEFAULT 0,
  remaining_balance NUMERIC GENERATED ALWAYS AS (total_price - advance_payment) STORED,
  trop_percu NUMERIC DEFAULT 0,
  invoice_number TEXT,
  payment_status TEXT DEFAULT 'PENDING',
  
  -- Order details
  status vn_order_status NOT NULL DEFAULT 'INSCRIPTION',
  location vn_order_location NOT NULL DEFAULT 'PARC1',
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order documents table
CREATE TABLE public.vn_order_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.vn_orders(id) ON DELETE CASCADE,
  document_type vn_document_type NOT NULL,
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order history/audit log table
CREATE TABLE public.vn_order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.vn_orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vn_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vn_order_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vn_order_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vn_orders
CREATE POLICY "VN users and admins can view orders"
ON public.vn_orders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'vn') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "VN users and admins can insert orders"
ON public.vn_orders FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'vn') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "VN users and admins can update orders"
ON public.vn_orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'vn') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete orders"
ON public.vn_orders FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for vn_order_documents
CREATE POLICY "VN users and admins can view order documents"
ON public.vn_order_documents FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'vn') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "VN users and admins can insert order documents"
ON public.vn_order_documents FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'vn') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "VN users and admins can delete order documents"
ON public.vn_order_documents FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'vn') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for vn_order_history
CREATE POLICY "VN users and admins can view order history"
ON public.vn_order_history FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'vn') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "VN users and admins can insert order history"
ON public.vn_order_history FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'vn') OR public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for order documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('vn-order-documents', 'vn-order-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for order documents
CREATE POLICY "VN users can upload order documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vn-order-documents' AND
  (public.has_role(auth.uid(), 'vn') OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "VN users can view order documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'vn-order-documents' AND
  (public.has_role(auth.uid(), 'vn') OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "VN users can delete order documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'vn-order-documents' AND
  (public.has_role(auth.uid(), 'vn') OR public.has_role(auth.uid(), 'admin'))
);

-- Create function to automatically generate order numbers
CREATE OR REPLACE FUNCTION public.generate_vn_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  order_num TEXT;
BEGIN
  -- Get the count of orders for this year
  SELECT COUNT(*) + 1 INTO next_number
  FROM public.vn_orders
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM now());
  
  -- Format: BM-YYYY-XXX
  order_num := 'BM-' || EXTRACT(YEAR FROM now()) || '-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN order_num;
END;
$$;

-- Create trigger to auto-generate order numbers
CREATE OR REPLACE FUNCTION public.set_vn_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.generate_vn_order_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_vn_order_number_trigger
BEFORE INSERT ON public.vn_orders
FOR EACH ROW
EXECUTE FUNCTION public.set_vn_order_number();

-- Create trigger for updated_at
CREATE TRIGGER update_vn_orders_updated_at
BEFORE UPDATE ON public.vn_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to log order changes
CREATE OR REPLACE FUNCTION public.log_vn_order_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.vn_order_history (order_id, user_id, action, details)
  VALUES (
    NEW.id,
    auth.uid(),
    TG_OP,
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_vn_order_updates
AFTER UPDATE ON public.vn_orders
FOR EACH ROW
EXECUTE FUNCTION public.log_vn_order_change();