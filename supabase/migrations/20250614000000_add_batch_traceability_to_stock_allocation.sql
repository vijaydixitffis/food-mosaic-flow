-- Add batch traceability fields to stock_allocation
-- These are nullable; existing rows are unaffected.
-- Ingredient INWARD (supplier delivery) will use these in Phase 2.
-- Product INWARD (WO → COMPLETE) and Product OUTWARD (Order allocation) use them from Phase 1.
ALTER TABLE stock_allocation
  ADD COLUMN IF NOT EXISTS batch_number TEXT,
  ADD COLUMN IF NOT EXISTS mfg_date     DATE,
  ADD COLUMN IF NOT EXISTS expiry_date  DATE;
