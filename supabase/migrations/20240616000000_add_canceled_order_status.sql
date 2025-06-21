-- Add CANCELED status to orders table
-- Drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_order_status;

-- Add the updated check constraint with CANCELED status
ALTER TABLE orders
  ADD CONSTRAINT check_order_status
  CHECK (status IN ('NEW', 'IN PROGRESS', 'SHIPPED', 'DELIVERED', 'BILLED', 'COMPLETE', 'CANCELED')); 