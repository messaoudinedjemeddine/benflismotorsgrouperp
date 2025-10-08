-- Add promotional campaigns and repair images to complete mock data

-- Add promotional campaigns
INSERT INTO promo_campaigns (campaign_name, communication_type, predefined_message, excel_file_url, employee_id) 
VALUES
('Autumn Promotion 2024', 'whatsapp', 'Get 20% off on all spare parts this month!', '/storage/excel-files/autumn-promotion-2024.xlsx', '66666666-6666-6666-6666-666666666666'::uuid),
('Special Repair Offer', 'email', '15% discount on all repair services until end of month.', '/storage/excel-files/repair-offer-2024.xlsx', '66666666-6666-6666-6666-666666666666'::uuid);

-- Link resellers to campaigns
WITH campaigns AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM promo_campaigns),
     resellers_sample AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM resellers)
INSERT INTO campaign_resellers (campaign_id, reseller_id)
SELECT c.id, r.id
FROM campaigns c
CROSS JOIN resellers_sample r
WHERE (c.rn = 1 AND r.rn <= 3) OR (c.rn = 2 AND r.rn > 3);

-- Add repair images
WITH repair_sample AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM repair_orders
)
INSERT INTO repair_images (repair_order_id, image_url, description)
SELECT 
  ro.id,
  CASE ro.rn
    WHEN 1 THEN '/storage/repair-images/damage-front-bumper.jpg'
    WHEN 2 THEN '/storage/repair-images/door-scratches.jpg'
  END,
  CASE ro.rn
    WHEN 1 THEN 'Front bumper damage'
    WHEN 2 THEN 'Left door scratches'
  END
FROM repair_sample ro;