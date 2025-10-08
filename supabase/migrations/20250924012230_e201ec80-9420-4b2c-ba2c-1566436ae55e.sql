-- Simplified data seeding using generated UUIDs to avoid syntax issues

-- Clear existing data first
TRUNCATE TABLE campaign_resellers RESTART IDENTITY CASCADE;
TRUNCATE TABLE promo_campaigns RESTART IDENTITY CASCADE;
TRUNCATE TABLE repair_images RESTART IDENTITY CASCADE;
TRUNCATE TABLE order_pieces RESTART IDENTITY CASCADE;
TRUNCATE TABLE parts_orders RESTART IDENTITY CASCADE;
TRUNCATE TABLE repair_orders RESTART IDENTITY CASCADE;
TRUNCATE TABLE client_visits RESTART IDENTITY CASCADE;
TRUNCATE TABLE cars RESTART IDENTITY CASCADE;
TRUNCATE TABLE clients RESTART IDENTITY CASCADE;
TRUNCATE TABLE resellers RESTART IDENTITY CASCADE;

-- Insert sample clients first
INSERT INTO clients (name, phone_number, email) VALUES
('Karim Belkacem', '0551234573', 'karim.belkacem@email.com'),
('Nadia Hammadi', '0661234574', 'nadia.hammadi@email.com'),
('Omar Sedik', '0771234575', 'omar.sedik@email.com'),
('Leila Boudjelal', '0561234576', 'leila.boudjelal@email.com'),
('Rachid Meziane', '0651234577', 'rachid.meziane@email.com');

-- Insert sample resellers with valid Algerian phone numbers
INSERT INTO resellers (name, phone_number, email) VALUES
('Auto Parts Alger', '0551234578', 'contact@autoparts-alger.dz'),
('Pieces Oran', '0661234579', 'info@pieces-oran.dz'),
('Garage Constantine', '0771234580', 'service@garage-constantine.dz'),
('Mecanique Annaba', '0561234581', 'contact@mecanique-annaba.dz'),
('Auto Service Tizi', '0651234582', 'hello@autoservice-tizi.dz');

-- Insert sample cars (get first 5 client IDs)
WITH client_ids AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn 
  FROM clients 
  LIMIT 5
)
INSERT INTO cars (client_id, brand, model, vin)
SELECT 
  id, 
  CASE rn 
    WHEN 1 THEN 'Renault'
    WHEN 2 THEN 'Peugeot' 
    WHEN 3 THEN 'Hyundai'
    WHEN 4 THEN 'Toyota'
    WHEN 5 THEN 'Volkswagen'
  END,
  CASE rn
    WHEN 1 THEN 'Clio'
    WHEN 2 THEN '208'
    WHEN 3 THEN 'i20' 
    WHEN 4 THEN 'Yaris'
    WHEN 5 THEN 'Polo'
  END,
  CASE rn
    WHEN 1 THEN 'VF1CB1A0652123456'
    WHEN 2 THEN 'VF3CA1A0652123457'
    WHEN 3 THEN 'KMHB3E1A6JM123458'
    WHEN 4 THEN 'VNKKTUD20PA123459'
    WHEN 5 THEN 'WVWZZZ6RZ9P123460'
  END
FROM client_ids;