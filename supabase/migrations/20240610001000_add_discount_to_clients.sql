-- Add Discount column to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS discount NUMERIC(5,2) NOT NULL DEFAULT 0;

-- Add check constraint for 0 <= discount <= 100
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_discount_range'
  ) THEN
    ALTER TABLE clients
    ADD CONSTRAINT check_discount_range CHECK (discount >= 0 AND discount <= 100);
  END IF;
END$$;
-- Remove the default after adding the column
ALTER TABLE clients
ALTER COLUMN discount DROP DEFAULT;

-- Add comment to the column
COMMENT ON COLUMN clients.discount IS 'Discount percentage for the client (0-100)'; 