-- Add category_id column to orders table
ALTER TABLE orders 
ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Create index on category_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_category_id ON orders(category_id);

-- Update existing orders to have a default category (optional)
-- This sets existing orders to the "Others" category if they don't have one
UPDATE orders 
SET category_id = (SELECT id FROM categories WHERE category_code = 'OTH01' LIMIT 1)
WHERE category_id IS NULL AND EXISTS (SELECT 1 FROM categories WHERE category_code = 'OTH01');

ALTER TABLE clients
    ALTER COLUMN company_registration_number DROP NOT NULL,
    ALTER COLUMN office_phone_number DROP NOT NULL,
    ALTER COLUMN gst_number DROP NOT NULL,
    ALTER COLUMN contact_person DROP NOT NULL;

