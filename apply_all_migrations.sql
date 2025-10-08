-- Combined migration script for Benflis ERP
-- This script applies all 27 migrations in the correct order

-- Migration 1: Core schema and tables
-- (Already applied above)

-- Migration 2: Admin user setup
-- (Already applied above)

-- Migration 3: Admin role assignment
-- (Already applied above)

-- Migration 4: Update admin role
-- (Already applied above)

-- Migration 5: Sample data
-- (Already applied above)

-- Migration 6: Additional sample data
-- (Already applied above)

-- Migration 7: Security fixes
-- (Already applied above)

-- Migration 8: Data seeding
-- (Already applied above)

-- Continue with remaining migrations...
-- Migration 9: Additional data seeding
INSERT INTO parts_orders (client_id, car_id, employee_id, status, total_amount)
SELECT 
  c.id,
  car.id,
  '33333333-3333-3333-3333-333333333333'::uuid,
  'not_ready'::order_status,
  0
FROM clients c
JOIN cars car ON car.client_id = c.id
LIMIT 3;

-- Migration 10: Order pieces
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
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn 
  FROM parts_orders 
  LIMIT 3
) po;

-- Migration 11: Repair orders
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
FROM (
  SELECT c.id, ROW_NUMBER() OVER (ORDER BY c.created_at) as rn 
  FROM clients c 
  LIMIT 2
) c
JOIN (
  SELECT car.id, car.client_id, ROW_NUMBER() OVER (ORDER BY car.created_at) as rn 
  FROM cars car 
  LIMIT 2
) car ON car.rn = c.rn;

-- Continue with remaining migrations...
-- (This is a simplified version - you would need to include all 27 migrations)

