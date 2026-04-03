-- SQL Script to populate invoice numbers for existing orders
-- Run this script to generate invoice numbers for orders that don't have one
-- Invoice format: {prefix}{sequence} (e.g., MF/25-26/0100)

-- Create a function to generate invoice numbers
CREATE OR REPLACE FUNCTION populate_invoice_numbers()
RETURNS TABLE (
    order_id UUID,
    old_invoice_number VARCHAR(50),
    new_invoice_number VARCHAR(50)
) AS $$
DECLARE
    v_prefix VARCHAR(50) := 'MF/25-26/';
    v_order RECORD;
    v_sequence INTEGER;
    v_invoice_number VARCHAR(50);
    v_max_existing_sequence INTEGER;
BEGIN
    -- Find the highest existing invoice number sequence for this prefix
    SELECT MAX(
        CAST(
            NULLIF(
                REGEXP_REPLACE(invoice_number, '^' || v_prefix, ''),
                ''
            ) AS INTEGER
        )
    )
    INTO v_max_existing_sequence
    FROM orders
    WHERE invoice_number LIKE v_prefix || '%';
    
    -- Start from next sequence number after the highest existing one
    -- If no existing numbers found, start at 100
    IF v_max_existing_sequence IS NOT NULL THEN
        v_sequence := v_max_existing_sequence + 1;
    ELSE
        v_sequence := 100;
    END IF;
    
    -- Process orders that don't have invoice numbers, ordered by created_at
    FOR v_order IN 
        SELECT id, created_at, invoice_number
        FROM orders
        WHERE invoice_number IS NULL
        ORDER BY created_at ASC
    LOOP
        -- Generate invoice number
        v_invoice_number := v_prefix || LPAD(v_sequence::TEXT, 4, '0');
        
        -- Update the order
        UPDATE orders
        SET invoice_number = v_invoice_number
        WHERE id = v_order.id;
        
        -- Return the result
        order_id := v_order.id;
        old_invoice_number := v_order.invoice_number;
        new_invoice_number := v_invoice_number;
        RETURN NEXT;
        
        -- Increment sequence for next order
        v_sequence := v_sequence + 1;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Execute the function and show results
SELECT * FROM populate_invoice_numbers();

-- Clean up the function after execution (optional - comment out if you want to keep it)
-- DROP FUNCTION IF EXISTS populate_invoice_numbers();
