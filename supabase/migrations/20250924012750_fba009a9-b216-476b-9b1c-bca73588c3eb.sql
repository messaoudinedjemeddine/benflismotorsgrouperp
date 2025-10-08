-- Add mock employee profiles for demonstration
INSERT INTO profiles (user_id, full_name, email, phone_number, role) VALUES
('22222222-2222-2222-2222-222222222222'::uuid, 'Fatima Ouali', 'parts@benflismotors.com', '0661234568', 'parts_employee'),
('33333333-3333-3333-3333-333333333333'::uuid, 'Mohamed Cherif', 'repair@benflismotors.com', '0771234569', 'repair_creator'),
('44444444-4444-4444-4444-444444444444'::uuid, 'Amina Kaid', 'pricer@benflismotors.com', '0561234570', 'repair_pricer'),
('55555555-5555-5555-5555-555555555555'::uuid, 'Youcef Mansouri', 'visits@benflismotors.com', '0651234571', 'visit_manager'),
('66666666-6666-6666-6666-666666666666'::uuid, 'Samira Benali', 'resellers@benflismotors.com', '0751234572', 'reseller_manager')
ON CONFLICT (user_id) DO NOTHING;

-- Clear existing transactional data
DELETE FROM repair_images;
DELETE FROM order_pieces;
DELETE FROM parts_orders;
DELETE FROM repair_orders;
DELETE FROM client_visits;

-- Add parts orders
WITH clients_sample AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM clients LIMIT 3
),
cars_sample AS (
  SELECT id, client_id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM cars LIMIT 3
)
INSERT INTO parts_orders (client_id, car_id, employee_id, status, total_amount)
SELECT 
  c.id,
  car.id,
  '22222222-2222-2222-2222-222222222222'::uuid,
  CASE c.rn 
    WHEN 1 THEN 'ready'::order_status
    WHEN 2 THEN 'not_ready'::order_status  
    WHEN 3 THEN 'ready'::order_status
  END,
  CASE c.rn
    WHEN 1 THEN 15000.00
    WHEN 2 THEN 8500.00
    WHEN 3 THEN 12300.00
  END
FROM clients_sample c
JOIN cars_sample car ON car.rn = c.rn;

-- Add order pieces
WITH po_sample AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM parts_orders
)
INSERT INTO order_pieces (order_id, reference, price, quantity)
SELECT 
  po.id,
  CASE po.rn
    WHEN 1 THEN 'PLQ-001-REN'
    WHEN 2 THEN 'BRK-003-PEU'
    WHEN 3 THEN 'ENG-007-HYU'
  END,
  CASE po.rn
    WHEN 1 THEN 7500.00
    WHEN 2 THEN 4250.00
    WHEN 3 THEN 12300.00
  END,
  2
FROM po_sample po;

-- Add repair orders
WITH clients_repair AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM clients LIMIT 2
),
cars_repair AS (
  SELECT id, client_id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM cars LIMIT 2
)
INSERT INTO repair_orders (client_id, car_id, creator_employee_id, pricer_employee_id, damage_description, repair_price, status)
SELECT 
  c.id,
  car.id,
  '33333333-3333-3333-3333-333333333333'::uuid,
  CASE c.rn WHEN 1 THEN '44444444-4444-4444-4444-444444444444'::uuid ELSE NULL END,
  CASE c.rn
    WHEN 1 THEN 'Front bumper and right headlight damage'
    WHEN 2 THEN 'Left door scratches'
  END,
  CASE c.rn WHEN 1 THEN 25000.00 ELSE NULL END,
  CASE c.rn WHEN 1 THEN 'price_set'::repair_status ELSE 'price_not_set'::repair_status END
FROM clients_repair c
JOIN cars_repair car ON car.rn = c.rn;

-- Add client visits
WITH clients_visits AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM clients LIMIT 5
),
cars_visits AS (
  SELECT id, client_id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM cars LIMIT 5
)
INSERT INTO client_visits (client_id, car_id, last_visit_date, category, notes)
SELECT 
  c.id,
  car.id,
  CASE c.rn
    WHEN 1 THEN '2024-09-15 10:00:00+00'::timestamptz
    WHEN 2 THEN '2024-07-20 14:30:00+00'::timestamptz
    WHEN 3 THEN '2024-03-10 09:15:00+00'::timestamptz
    WHEN 4 THEN '2023-12-05 16:45:00+00'::timestamptz
    WHEN 5 THEN '2023-08-15 11:20:00+00'::timestamptz
  END,
  CASE c.rn
    WHEN 1 THEN 'less_than_month'::visit_category
    WHEN 2 THEN 'one_to_three_months'::visit_category
    WHEN 3 THEN 'three_to_six_months'::visit_category
    WHEN 4 THEN 'six_months_to_year'::visit_category
    WHEN 5 THEN 'more_than_year'::visit_category
  END,
  CASE c.rn
    WHEN 1 THEN 'Oil change and general check'
    WHEN 2 THEN 'Brake pad replacement'
    WHEN 3 THEN 'Electrical system repair'
    WHEN 4 THEN 'Technical inspection and repairs'
    WHEN 5 THEN 'Complete engine overhaul'
  END
FROM clients_visits c
JOIN cars_visits car ON car.rn = c.rn;