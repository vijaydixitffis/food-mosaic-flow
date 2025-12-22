-- Add category_id column to products table
ALTER TABLE products 
ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Create index on category_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Update existing products to have a default category (optional)
-- This sets existing products to the "Retail" category if they don't have one
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE category_code = 'RET01' LIMIT 1)
WHERE category_id IS NULL AND EXISTS (SELECT 1 FROM categories WHERE category_code = 'RET01');
