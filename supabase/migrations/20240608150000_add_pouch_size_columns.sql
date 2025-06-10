-- Add new columns to work_order_products table
ALTER TABLE work_order_products
ADD COLUMN IF NOT EXISTS pouch_size INTEGER,
ADD COLUMN IF NOT EXISTS total_weight INTEGER;

-- Backfill existing data (assuming existing data is in kg)
UPDATE work_order_products
SET 
  pouch_size = ROUND(pouch_size * 1000),
  total_weight = ROUND(total_weight * 1000);

-- Make the new columns required
ALTER TABLE work_order_products
ALTER COLUMN pouch_size SET NOT NULL,
ALTER COLUMN total_weight SET NOT NULL;

-- Add check constraints
ALTER TABLE work_order_products
ADD CONSTRAINT check_pouch_size_positive CHECK (pouch_size_g > 0),
ADD CONSTRAINT check_total_weight_positive CHECK (total_weight_g > 0);
