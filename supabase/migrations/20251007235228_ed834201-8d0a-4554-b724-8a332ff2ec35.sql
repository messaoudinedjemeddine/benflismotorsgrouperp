-- Add created_by column to vn_order_accessories
ALTER TABLE vn_order_accessories 
ADD COLUMN created_by uuid REFERENCES auth.users(id);

-- Create an index for better query performance
CREATE INDEX idx_vn_order_accessories_created_by ON vn_order_accessories(created_by);