-- Insert mock VN orders (excluding generated column remaining_balance)
INSERT INTO public.vn_orders (
  order_number, customer_name, customer_phone, customer_email, customer_id_number,
  customer_address, vehicle_brand, vehicle_model, vehicle_year, vehicle_color,
  vehicle_vin, vehicle_features, vehicle_avaries, status, location,
  total_price, advance_payment, payment_status, invoice_number, trop_percu
) VALUES
  ('BM-2024-001', 'Ahmed Benali', '0555123456', 'ahmed.benali@email.dz', '1234567890123456',
   '15 Rue Didouche Mourad, Alger Centre', 'Toyota', 'Land Cruiser', 2024, 'White',
   'JT3HN86R3Y0123456', ARRAY['Sunroof', 'Leather Seats', 'GPS Navigation'], 'Minor scratches', 'LIVRAISON', 'PARC1', 8500000, 3000000, 'PARTIAL', 'INV-2024-001', 0),
  ('BM-2024-002', 'Fatima Meziane', '0661234567', 'fatima.meziane@email.dz', '2345678901234567',
   '42 Boulevard Zighout Youcef, Oran', 'Hyundai', 'Tucson', 2024, 'Silver', 'KMHJ381BBMU123456', ARRAY['Auto', 'Climate', 'Bluetooth'], NULL, 'FACTURATION', 'PARC2', 4200000, 2000000, 'PARTIAL', 'INV-2024-002', 0),
  ('BM-2024-003', 'Karim Hadji', '0770123456', 'karim.hadji@email.dz', '3456789012345678',
   '8 Avenue de l''Indépendance, Constantine', 'Peugeot', '3008', 2024, 'Blue', 'VF3LCYHZPMS123456', ARRAY['Cruise', 'Lane Assist', 'Camera'], NULL, 'ARRIVAGE', 'SHOWROOM', 3800000, 1500000, 'PARTIAL', NULL, 0),
  ('BM-2024-004', 'Amina Khelifi', '0550987654', 'amina.khelifi@email.dz', '4567890123456789',
   '25 Rue Larbi Ben M''hidi, Sétif', 'Renault', 'Duster', 2024, 'Gray', 'VF1HSDB2H56123456', ARRAY['4x4', 'Hill Descent'], 'Small dent', 'CARTE_JAUNE', 'PARC1', 3200000, 1600000, 'PARTIAL', 'INV-2024-004', 0),
  ('BM-2024-005', 'Youcef Boudiaf', '0663456789', 'youcef.boudiaf@email.dz', '5678901234567890',
   '10 Rue Mohamed Khemisti, Annaba', 'Volkswagen', 'Tiguan', 2023, 'Black', 'WVGZZZ5NZJW123456', ARRAY['Panoramic Roof', 'Heated Seats'], NULL, 'VALIDATION', 'PARC2', 5500000, 2750000, 'PARTIAL', NULL, 0),
  ('BM-2024-006', 'Nadia Cherif', '0771234567', 'nadia.cherif@email.dz', '6789012345678901',
   '33 Boulevard du 1er Novembre, Béjaïa', 'Kia', 'Sportage', 2024, 'Red', '5XYP3DHC5MG123456', ARRAY['LED', 'Wireless Charging'], NULL, 'COMMANDE', 'SHOWROOM', 4800000, 1000000, 'PARTIAL', NULL, 0),
  ('BM-2024-007', 'Rachid Belkacem', '0552345678', 'rachid.belkacem@email.dz', '7890123456789012',
   '18 Rue des Frères Bouadou, Tlemcen', 'Nissan', 'Qashqai', 2024, 'White Pearl', 'SJNFDAJ11U1123456', ARRAY['ProPilot', '360 Camera'], NULL, 'PROFORMA', 'PARC1', 4500000, 500000, 'PARTIAL', NULL, 0),
  ('BM-2024-008', 'Samira Mansouri', '0660345678', 'samira.mansouri@email.dz', '8901234567890123',
   '5 Avenue Pasteur, Blida', 'Ford', 'Escape', 2024, 'Silver', '1FMCU0HD5MUA12345', ARRAY['Co-Pilot360', 'Power Liftgate'], NULL, 'INSCRIPTION', 'PARC2', 4300000, 0, 'PENDING', NULL, 0),
  ('BM-2024-009', 'Mohamed Taleb', '0773456789', 'mohamed.taleb@email.dz', '9012345678901234',
   '22 Rue Didouche Mourad, Tizi Ouzou', 'Mazda', 'CX-5', 2024, 'Deep Blue', 'JM3KFBDM5M0123456', ARRAY['Skyactiv', 'Head-Up Display'], NULL, 'ACCUSÉ', 'SHOWROOM', 4700000, 2350000, 'PARTIAL', NULL, 0),
  ('BM-2024-010', 'Leila Hamidi', '0551234567', 'leila.hamidi@email.dz', '0123456789012345',
   '7 Boulevard de la Soummam, Bouira', 'Chery', 'Tiggo 8', 2024, 'Burgundy', 'LVVDB11B7MD123456', ARRAY['7 Seats', 'CarPlay', 'Android Auto'], NULL, 'DOSSIER_DAIRA', 'PARC1', 3500000, 3500000, 'PAID', 'INV-2024-010', 100000)
ON CONFLICT (order_number) DO NOTHING;