-- Add GST column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS gst NUMERIC(5,2);

-- Add check constraint for 0 <= gst < 100
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_gst_range'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT check_gst_range CHECK (gst >= 0 AND gst < 100);
  END IF;
END$$;

-- Add comment to the column
COMMENT ON COLUMN products.gst IS 'Goods and Services Tax (GST) percentage for the product (0-99.99)'; 