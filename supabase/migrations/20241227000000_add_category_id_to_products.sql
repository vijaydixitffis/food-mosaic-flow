-- Add category_id column to products table
ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id);

-- Create index on category_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Add comment to describe the column
COMMENT ON COLUMN products.category_id IS 'Foreign key to categories table for product categorization';
