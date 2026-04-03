-- Migration: Add invoice_number column to orders table
-- Created: April 3, 2026

-- Add invoice_number column to orders table
ALTER TABLE orders 
ADD COLUMN invoice_number VARCHAR(50) UNIQUE;

-- Create index for faster lookups by invoice number
CREATE INDEX idx_orders_invoice_number ON orders(invoice_number);

-- Add comment explaining the column
COMMENT ON COLUMN orders.invoice_number IS 'Auto-generated invoice number in format: PREFIX-SEQUENCE (e.g., INV-0001)';
