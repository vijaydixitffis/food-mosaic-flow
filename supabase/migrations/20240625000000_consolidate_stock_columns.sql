-- Consolidate stock management by adding current_stock to products table
-- and removing the separate product_stock table

-- Add current_stock column to products table
ALTER TABLE products ADD COLUMN current_stock DECIMAL(10, 2) DEFAULT 0;

-- Migrate existing product stock data to products.current_stock (if product_stock table exists)
DO $$
BEGIN
    -- Check if product_stock table exists before trying to migrate data
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_stock') THEN
        UPDATE products 
        SET current_stock = COALESCE(
            (SELECT quantity FROM product_stock WHERE product_stock.product_id = products.id), 
            0
        );
        
        -- Drop the product_stock table and related policies
        DROP POLICY IF EXISTS select_product_stock ON product_stock;
        DROP POLICY IF EXISTS manage_product_stock ON product_stock;
        DROP TABLE IF EXISTS product_stock;
    END IF;
END $$; 