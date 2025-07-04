-- Comprehensive fix for all missing columns across all tables
-- This migration ensures all columns expected by the application exist

-- 1. Add missing columns to ingredients table
ALTER TABLE public.ingredients 
ADD COLUMN IF NOT EXISTS unit_of_measurement TEXT,
ADD COLUMN IF NOT EXISTS rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Add missing columns to compounds table
ALTER TABLE public.compounds 
ADD COLUMN IF NOT EXISTS unit_of_measurement TEXT,
ADD COLUMN IF NOT EXISTS rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS short_description TEXT;

-- 3. Add missing columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS gst NUMERIC(5,2);

-- 4. Update existing ingredients with default values
UPDATE public.ingredients 
SET unit_of_measurement = 'KG' 
WHERE unit_of_measurement IS NULL;

UPDATE public.ingredients 
SET rate = 0.00 
WHERE rate IS NULL;

UPDATE public.ingredients 
SET short_description = description 
WHERE short_description IS NULL AND description IS NOT NULL;

UPDATE public.ingredients 
SET tags = '{}' 
WHERE tags IS NULL;

-- 5. Update existing compounds with default values
UPDATE public.compounds 
SET unit_of_measurement = 'KG' 
WHERE unit_of_measurement IS NULL;

UPDATE public.compounds 
SET rate = 0.00 
WHERE rate IS NULL;

UPDATE public.compounds 
SET short_description = description 
WHERE short_description IS NULL AND description IS NOT NULL;

-- 6. Update existing products with default values
UPDATE public.products 
SET hsn_code = '' 
WHERE hsn_code IS NULL;

UPDATE public.products 
SET gst = 0.00 
WHERE gst IS NULL;

-- 7. Add check constraints for products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_gst_range'
  ) THEN
    ALTER TABLE public.products
    ADD CONSTRAINT check_gst_range CHECK (gst >= 0 AND gst < 100);
  END IF;
END$$;

-- 8. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ingredients_unit_of_measurement ON public.ingredients(unit_of_measurement);
CREATE INDEX IF NOT EXISTS idx_ingredients_rate ON public.ingredients(rate);
CREATE INDEX IF NOT EXISTS idx_ingredients_tags ON public.ingredients USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_compounds_unit_of_measurement ON public.compounds(unit_of_measurement);
CREATE INDEX IF NOT EXISTS idx_compounds_rate ON public.compounds(rate);
CREATE INDEX IF NOT EXISTS idx_products_hsn_code ON public.products(hsn_code);
CREATE INDEX IF NOT EXISTS idx_products_gst ON public.products(gst);

-- 9. Add comments to columns
COMMENT ON COLUMN public.products.hsn_code IS 'Harmonized System of Nomenclature code for the product';
COMMENT ON COLUMN public.products.gst IS 'Goods and Services Tax (GST) percentage for the product (0-99.99)'; 