-- Fix missing columns in ingredients and compounds tables
-- This migration ensures all columns expected by the application exist

-- 1. Add missing columns to ingredients table
ALTER TABLE public.ingredients 
ADD COLUMN IF NOT EXISTS unit_of_measurement TEXT,
ADD COLUMN IF NOT EXISTS rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Add missing columns to compounds table (in case they don't exist)
ALTER TABLE public.compounds 
ADD COLUMN IF NOT EXISTS unit_of_measurement TEXT,
ADD COLUMN IF NOT EXISTS rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS short_description TEXT;

-- 3. Update existing ingredients with default values
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

-- 4. Update existing compounds with default values
UPDATE public.compounds 
SET unit_of_measurement = 'KG' 
WHERE unit_of_measurement IS NULL;

UPDATE public.compounds 
SET rate = 0.00 
WHERE rate IS NULL;

UPDATE public.compounds 
SET short_description = description 
WHERE short_description IS NULL AND description IS NOT NULL;

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ingredients_unit_of_measurement ON public.ingredients(unit_of_measurement);
CREATE INDEX IF NOT EXISTS idx_ingredients_rate ON public.ingredients(rate);
CREATE INDEX IF NOT EXISTS idx_ingredients_tags ON public.ingredients USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_compounds_unit_of_measurement ON public.compounds(unit_of_measurement);
CREATE INDEX IF NOT EXISTS idx_compounds_rate ON public.compounds(rate); 