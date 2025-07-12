-- Fix stock_allocation table by removing reference_type column and problematic check constraints
-- and recreating the table with proper structure

-- First, create a backup of existing data
CREATE TABLE IF NOT EXISTS stock_allocation_backup_fix AS 
SELECT * FROM stock_allocation;

-- Drop existing table and recreate with new structure
DROP TABLE IF EXISTS stock_allocation;

-- Create new stock_allocation table with the required structure (without reference_type)
CREATE TABLE stock_allocation (
    stock_entry_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    stock_entry_type TEXT NOT NULL CHECK (stock_entry_type IN ('INWARD', 'OUTWARD')),
    stock_type TEXT NOT NULL CHECK (stock_type IN ('INGREDIENT', 'PRODUCT')),
    stock_item_id uuid NOT NULL,
    reference_id uuid,
    quantity_allocated DECIMAL(10, 2) NOT NULL,
    allocation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_stock_allocation_stock_type ON stock_allocation(stock_type);
CREATE INDEX idx_stock_allocation_stock_item_id ON stock_allocation(stock_item_id);
CREATE INDEX idx_stock_allocation_reference ON stock_allocation(reference_id);
CREATE INDEX idx_stock_allocation_date ON stock_allocation(allocation_date);

-- Migrate existing data from backup
INSERT INTO stock_allocation (
    stock_entry_id,
    stock_entry_type,
    stock_type,
    stock_item_id,
    reference_id,
    quantity_allocated,
    allocation_date
)
SELECT 
    stock_entry_id,
    stock_entry_type,
    stock_type,
    stock_item_id,
    reference_id,
    quantity_allocated,
    allocation_date
FROM stock_allocation_backup_fix;

-- Drop the backup table
DROP TABLE stock_allocation_backup_fix;

-- Add RLS policies for the new table structure
ALTER TABLE stock_allocation ENABLE ROW LEVEL SECURITY;

-- Policy for selecting stock allocations
CREATE POLICY "select_stock_allocation" ON stock_allocation
    FOR SELECT USING (true);

-- Policy for inserting stock allocations
CREATE POLICY "insert_stock_allocation" ON stock_allocation
    FOR INSERT WITH CHECK (true);

-- Policy for updating stock allocations
CREATE POLICY "update_stock_allocation" ON stock_allocation
    FOR UPDATE USING (true);

-- Policy for deleting stock allocations
CREATE POLICY "delete_stock_allocation" ON stock_allocation
    FOR DELETE USING (true); 