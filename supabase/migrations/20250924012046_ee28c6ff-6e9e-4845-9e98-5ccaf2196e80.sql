-- Comprehensive data seeding for Benflis Motors Management System
-- This migration adds proper sample data with valid constraints

-- Clear existing problematic data
DELETE FROM campaign_resellers;
DELETE FROM promo_campaigns;
DELETE FROM repair_images;
DELETE FROM order_pieces;
DELETE FROM parts_orders;
DELETE FROM repair_orders;
DELETE FROM client_visits;
DELETE FROM cars;
DELETE FROM clients;
DELETE FROM resellers;

-- Insert sample clients with valid Algerian phone numbers
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

-- Insert sample cars (using client_id from inserted clients)
INSERT INTO cars (client_id, brand, model, vin)
SELECT c.id, car_data.brand, car_data.model, car_data.vin
FROM clients c
CROSS JOIN (
  VALUES 
    ('Renault', 'Clio', 'VF1CB1A0652123456'),
    ('Peugeot', '208', 'VF3CA1A0652123457'),
    ('Hyundai', 'i20', 'KMHB3E1A6JM123458'),
    ('Toyota', 'Yaris', 'VNKKTUD20PA123459'),
    ('Volkswagen', 'Polo', 'WVWZZZ6RZ9P123460')
) AS car_data(brand, model, vin)
WHERE c.name IN ('Karim Belkacem', 'Nadia Hammadi', 'Omar Sedik', 'Leila Boudjelal', 'Rachid Meziane')
ORDER BY c.created_at
LIMIT 5;

-- Insert sample client visits with valid enum values
INSERT INTO client_visits (client_id, car_id, last_visit_date, category, notes)
SELECT 
  c.id,
  car.id,
  visit_data.visit_date,
  visit_data.category,
  visit_data.notes
FROM clients c
JOIN cars car ON car.client_id = c.id
CROSS JOIN (
  VALUES 
    ('2024-09-15 10:00:00+00'::timestamptz, 'less_than_month'::visit_category, 'Oil change and general inspection'),
    ('2024-07-20 14:30:00+00'::timestamptz, 'one_to_three_months'::visit_category, 'Brake pad replacement'),
    ('2024-03-10 09:15:00+00'::timestamptz, 'three_to_six_months'::visit_category, 'Electrical system repair'),
    ('2023-12-05 16:45:00+00'::timestamptz, 'six_months_to_year'::visit_category, 'Technical inspection and repairs'),
    ('2023-08-15 11:20:00+00'::timestamptz, 'more_than_year'::visit_category, 'Complete engine overhaul')
) AS visit_data(visit_date, category, notes)
ORDER BY c.created_at
LIMIT 5;