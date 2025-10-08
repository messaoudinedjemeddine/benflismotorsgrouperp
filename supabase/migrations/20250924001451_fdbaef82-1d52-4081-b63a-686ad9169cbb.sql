-- Create enum types for various statuses and roles
CREATE TYPE user_role AS ENUM ('admin', 'parts_employee', 'repair_creator', 'repair_pricer', 'visit_manager', 'reseller_manager');
CREATE TYPE order_status AS ENUM ('ready', 'not_ready', 'canceled');
CREATE TYPE repair_status AS ENUM ('price_set', 'price_not_set');
CREATE TYPE visit_category AS ENUM ('less_than_month', 'one_to_three_months', 'three_to_six_months', 'six_months_to_year', 'more_than_year');
CREATE TYPE communication_type AS ENUM ('email', 'whatsapp', 'both');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  role user_role NOT NULL DEFAULT 'parts_employee',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL CHECK (phone_number ~ '^0[567][0-9]{8}$'),
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cars table
CREATE TABLE public.cars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  vin TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create car parts orders table
CREATE TABLE public.parts_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  car_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  status order_status NOT NULL DEFAULT 'not_ready',
  total_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order pieces table
CREATE TABLE public.order_pieces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  reference TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create car repair orders table
CREATE TABLE public.repair_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  car_id UUID NOT NULL,
  creator_employee_id UUID NOT NULL,
  pricer_employee_id UUID,
  damage_description TEXT,
  repair_price DECIMAL(10,2),
  status repair_status NOT NULL DEFAULT 'price_not_set',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create repair images table
CREATE TABLE public.repair_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repair_order_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client visits table
CREATE TABLE public.client_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  car_id UUID NOT NULL,
  last_visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  category visit_category NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resellers table
CREATE TABLE public.resellers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL CHECK (phone_number ~ '^0[567][0-9]{8}$'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create promo campaigns table
CREATE TABLE public.promo_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  campaign_name TEXT NOT NULL,
  excel_file_url TEXT NOT NULL,
  communication_type communication_type NOT NULL,
  predefined_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign resellers junction table
CREATE TABLE public.campaign_resellers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  reseller_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_resellers ENABLE ROW LEVEL SECURITY;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create RLS policies for clients (accessible by all authenticated users)
CREATE POLICY "Authenticated users can view clients" ON public.clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert clients" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients" ON public.clients
  FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for cars
CREATE POLICY "Authenticated users can view cars" ON public.cars
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert cars" ON public.cars
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update cars" ON public.cars
  FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for parts orders
CREATE POLICY "Parts employees and admins can view parts orders" ON public.parts_orders
  FOR SELECT TO authenticated USING (
    public.get_current_user_role() IN ('parts_employee', 'admin')
  );

CREATE POLICY "Parts employees and admins can insert parts orders" ON public.parts_orders
  FOR INSERT TO authenticated WITH CHECK (
    public.get_current_user_role() IN ('parts_employee', 'admin')
  );

CREATE POLICY "Parts employees and admins can update parts orders" ON public.parts_orders
  FOR UPDATE TO authenticated USING (
    public.get_current_user_role() IN ('parts_employee', 'admin')
  );

-- Create RLS policies for order pieces
CREATE POLICY "Parts employees and admins can view order pieces" ON public.order_pieces
  FOR SELECT TO authenticated USING (
    public.get_current_user_role() IN ('parts_employee', 'admin')
  );

CREATE POLICY "Parts employees and admins can insert order pieces" ON public.order_pieces
  FOR INSERT TO authenticated WITH CHECK (
    public.get_current_user_role() IN ('parts_employee', 'admin')
  );

CREATE POLICY "Parts employees and admins can update order pieces" ON public.order_pieces
  FOR UPDATE TO authenticated USING (
    public.get_current_user_role() IN ('parts_employee', 'admin')
  );

-- Create RLS policies for repair orders
CREATE POLICY "Repair employees and admins can view repair orders" ON public.repair_orders
  FOR SELECT TO authenticated USING (
    public.get_current_user_role() IN ('repair_creator', 'repair_pricer', 'admin')
  );

CREATE POLICY "Repair creators and admins can insert repair orders" ON public.repair_orders
  FOR INSERT TO authenticated WITH CHECK (
    public.get_current_user_role() IN ('repair_creator', 'admin')
  );

CREATE POLICY "Repair employees and admins can update repair orders" ON public.repair_orders
  FOR UPDATE TO authenticated USING (
    public.get_current_user_role() IN ('repair_creator', 'repair_pricer', 'admin')
  );

-- Create RLS policies for repair images
CREATE POLICY "Repair employees and admins can view repair images" ON public.repair_images
  FOR SELECT TO authenticated USING (
    public.get_current_user_role() IN ('repair_creator', 'repair_pricer', 'admin')
  );

CREATE POLICY "Repair creators and admins can insert repair images" ON public.repair_images
  FOR INSERT TO authenticated WITH CHECK (
    public.get_current_user_role() IN ('repair_creator', 'admin')
  );

-- Create RLS policies for client visits
CREATE POLICY "Visit managers and admins can view client visits" ON public.client_visits
  FOR SELECT TO authenticated USING (
    public.get_current_user_role() IN ('visit_manager', 'admin')
  );

CREATE POLICY "Visit managers and admins can insert client visits" ON public.client_visits
  FOR INSERT TO authenticated WITH CHECK (
    public.get_current_user_role() IN ('visit_manager', 'admin')
  );

CREATE POLICY "Visit managers and admins can update client visits" ON public.client_visits
  FOR UPDATE TO authenticated USING (
    public.get_current_user_role() IN ('visit_manager', 'admin')
  );

-- Create RLS policies for resellers
CREATE POLICY "Reseller managers and admins can view resellers" ON public.resellers
  FOR SELECT TO authenticated USING (
    public.get_current_user_role() IN ('reseller_manager', 'admin')
  );

CREATE POLICY "Reseller managers and admins can insert resellers" ON public.resellers
  FOR INSERT TO authenticated WITH CHECK (
    public.get_current_user_role() IN ('reseller_manager', 'admin')
  );

CREATE POLICY "Reseller managers and admins can update resellers" ON public.resellers
  FOR UPDATE TO authenticated USING (
    public.get_current_user_role() IN ('reseller_manager', 'admin')
  );

-- Create RLS policies for promo campaigns
CREATE POLICY "Reseller managers and admins can view promo campaigns" ON public.promo_campaigns
  FOR SELECT TO authenticated USING (
    public.get_current_user_role() IN ('reseller_manager', 'admin')
  );

CREATE POLICY "Reseller managers and admins can insert promo campaigns" ON public.promo_campaigns
  FOR INSERT TO authenticated WITH CHECK (
    public.get_current_user_role() IN ('reseller_manager', 'admin')
  );

-- Create RLS policies for campaign resellers
CREATE POLICY "Reseller managers and admins can view campaign resellers" ON public.campaign_resellers
  FOR SELECT TO authenticated USING (
    public.get_current_user_role() IN ('reseller_manager', 'admin')
  );

CREATE POLICY "Reseller managers and admins can insert campaign resellers" ON public.campaign_resellers
  FOR INSERT TO authenticated WITH CHECK (
    public.get_current_user_role() IN ('reseller_manager', 'admin')
  );

-- Add foreign key constraints
ALTER TABLE public.cars ADD CONSTRAINT cars_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.parts_orders ADD CONSTRAINT parts_orders_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.parts_orders ADD CONSTRAINT parts_orders_car_id_fkey 
  FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE;

ALTER TABLE public.order_pieces ADD CONSTRAINT order_pieces_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES public.parts_orders(id) ON DELETE CASCADE;

ALTER TABLE public.repair_orders ADD CONSTRAINT repair_orders_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.repair_orders ADD CONSTRAINT repair_orders_car_id_fkey 
  FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE;

ALTER TABLE public.repair_images ADD CONSTRAINT repair_images_repair_order_id_fkey 
  FOREIGN KEY (repair_order_id) REFERENCES public.repair_orders(id) ON DELETE CASCADE;

ALTER TABLE public.client_visits ADD CONSTRAINT client_visits_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.client_visits ADD CONSTRAINT client_visits_car_id_fkey 
  FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE;

ALTER TABLE public.campaign_resellers ADD CONSTRAINT campaign_resellers_campaign_id_fkey 
  FOREIGN KEY (campaign_id) REFERENCES public.promo_campaigns(id) ON DELETE CASCADE;

ALTER TABLE public.campaign_resellers ADD CONSTRAINT campaign_resellers_reseller_id_fkey 
  FOREIGN KEY (reseller_id) REFERENCES public.resellers(id) ON DELETE CASCADE;

-- Create function to update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cars_updated_at
  BEFORE UPDATE ON public.cars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parts_orders_updated_at
  BEFORE UPDATE ON public.parts_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_repair_orders_updated_at
  BEFORE UPDATE ON public.repair_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_visits_updated_at
  BEFORE UPDATE ON public.client_visits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resellers_updated_at
  BEFORE UPDATE ON public.resellers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'parts_employee'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('repair-images', 'repair-images', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('excel-files', 'excel-files', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);

-- Create storage policies for repair images
CREATE POLICY "Repair employees can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'repair-images' AND
    public.get_current_user_role() IN ('repair_creator', 'admin')
  );

CREATE POLICY "Repair employees can view images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'repair-images' AND
    public.get_current_user_role() IN ('repair_creator', 'repair_pricer', 'admin')
  );

-- Create storage policies for excel files
CREATE POLICY "Visit and reseller managers can upload excel files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'excel-files' AND
    public.get_current_user_role() IN ('visit_manager', 'reseller_manager', 'admin')
  );

CREATE POLICY "Visit and reseller managers can view excel files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'excel-files' AND
    public.get_current_user_role() IN ('visit_manager', 'reseller_manager', 'admin')
  );

-- Create storage policies for invoices
CREATE POLICY "Parts employees can upload invoices" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'invoices' AND
    public.get_current_user_role() IN ('parts_employee', 'admin')
  );

CREATE POLICY "Parts employees can view invoices" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoices' AND
    public.get_current_user_role() IN ('parts_employee', 'admin')
  );

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_cars_client_id ON public.cars(client_id);
CREATE INDEX idx_parts_orders_client_id ON public.parts_orders(client_id);
CREATE INDEX idx_parts_orders_status ON public.parts_orders(status);
CREATE INDEX idx_parts_orders_created_at ON public.parts_orders(created_at);
CREATE INDEX idx_order_pieces_order_id ON public.order_pieces(order_id);
CREATE INDEX idx_repair_orders_status ON public.repair_orders(status);
CREATE INDEX idx_repair_orders_created_at ON public.repair_orders(created_at);
CREATE INDEX idx_client_visits_category ON public.client_visits(category);
CREATE INDEX idx_client_visits_last_visit_date ON public.client_visits(last_visit_date);