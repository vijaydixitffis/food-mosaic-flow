-- Add HSN code column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(20) NOT NULL DEFAULT '';

-- Remove the default after adding the column
ALTER TABLE products
ALTER COLUMN hsn_code DROP DEFAULT;

-- Add index on hsn_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_hsn_code ON products(hsn_code);

-- Add comment to the column
COMMENT ON COLUMN products.hsn_code IS 'Harmonized System of Nomenclature code for the product'; 