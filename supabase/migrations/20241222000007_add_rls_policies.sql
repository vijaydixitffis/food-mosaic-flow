-- First, disable RLS and drop any existing policies to ensure clean slate
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read categories" ON categories;
DROP POLICY IF EXISTS "Allow admin users to insert categories" ON categories;
DROP POLICY IF EXISTS "Allow admin users to update categories" ON categories;
DROP POLICY IF EXISTS "Allow admin users to delete categories" ON categories;
DROP POLICY IF EXISTS "Categories: Allow read access to all authenticated users" ON categories;
DROP POLICY IF EXISTS "Categories: Allow insert access to admins" ON categories;
DROP POLICY IF EXISTS "Categories: Allow update access to admins" ON categories;
DROP POLICY IF EXISTS "Categories: Allow delete access to admins" ON categories;
DROP POLICY IF EXISTS "Enable all for authenticated users on categories" ON categories;
DROP POLICY IF EXISTS "Categories read access" ON categories;
DROP POLICY IF EXISTS "Categories write access" ON categories;

DROP POLICY IF EXISTS "Allow authenticated users to read product prices" ON product_prices;
DROP POLICY IF EXISTS "Allow admin users to insert product prices" ON product_prices;
DROP POLICY IF EXISTS "Allow admin users to update product prices" ON product_prices;
DROP POLICY IF EXISTS "Allow admin users to delete product prices" ON product_prices;
DROP POLICY IF EXISTS "Product Prices: Allow read access to all authenticated users" ON product_prices;
DROP POLICY IF EXISTS "Product Prices: Allow insert access to admins" ON product_prices;
DROP POLICY IF EXISTS "Product Prices: Allow update access to admins" ON product_prices;
DROP POLICY IF EXISTS "Product Prices: Allow delete access to admins" ON product_prices;
DROP POLICY IF EXISTS "Enable all for authenticated users on product_prices" ON product_prices;
DROP POLICY IF EXISTS "Product prices read access" ON product_prices;
DROP POLICY IF EXISTS "Product prices write access" ON product_prices;

-- Drop helper function if it exists
DROP FUNCTION IF EXISTS is_admin();

-- Now re-enable RLS and create new policies
-- Enable Row Level Security (RLS) on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security (RLS) on product_prices table
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;

-- Create policy for categories table:
-- - All authenticated users can view categories
-- - Only admins can insert, update, or delete categories

-- Policy to allow all authenticated users to read categories
CREATE POLICY "Allow authenticated users to read categories"
    ON categories
    FOR SELECT
    TO authenticated
    USING (auth.role() = 'authenticated');

-- Policy to allow admin users to insert categories
CREATE POLICY "Allow admin users to insert categories"
    ON categories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.active = true
        )
    );

-- Policy to allow admin users to update categories
CREATE POLICY "Allow admin users to update categories"
    ON categories
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.active = true
        )
    );

-- Policy to allow admin users to delete categories
CREATE POLICY "Allow admin users to delete categories"
    ON categories
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.active = true
        )
    );

-- Create policy for product_prices table:
-- - All authenticated users can view product prices
-- - Only admins can insert, update, or delete product prices

-- Policy to allow all authenticated users to read product prices
CREATE POLICY "Allow authenticated users to read product prices"
    ON product_prices
    FOR SELECT
    TO authenticated
    USING (auth.role() = 'authenticated');

-- Policy to allow admin users to insert product prices
CREATE POLICY "Allow admin users to insert product prices"
    ON product_prices
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.active = true
        )
    );

-- Policy to allow admin users to update product prices
CREATE POLICY "Allow admin users to update product prices"
    ON product_prices
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.active = true
        )
    );

-- Policy to allow admin users to delete product prices
CREATE POLICY "Allow admin users to delete product prices"
    ON product_prices
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.active = true
        )
    );

-- Create a helper function to check if user is admin (for easier maintenance)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.active = true
        )
    );
END;
$$;

-- Grant necessary permissions
-- All authenticated users can select from these tables
GRANT SELECT ON categories TO authenticated;
GRANT SELECT ON product_prices TO authenticated;

-- Admin users (checked via policies) can perform all operations
-- The policies above will enforce the admin check for INSERT, UPDATE, DELETE
