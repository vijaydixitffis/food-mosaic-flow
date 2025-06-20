-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_code VARCHAR(30) NOT NULL UNIQUE,
    remarks TEXT,
    order_date DATE NOT NULL,
    target_delivery_date DATE NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create order_products table (many-to-many: orders <-> products)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_products') THEN
    CREATE TABLE order_products (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      pouch_size INTEGER NOT NULL,
      number_of_pouches INTEGER NOT NULL,
      total_weight NUMERIC(10,2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
    );
  END IF;
END $$;

-- If the table already exists, migrate its columns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_products' AND column_name = 'quantity') THEN
    ALTER TABLE order_products DROP COLUMN quantity;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_products' AND column_name = 'price') THEN
    ALTER TABLE order_products DROP COLUMN price;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_products' AND column_name = 'pouch_size') THEN
    ALTER TABLE order_products ADD COLUMN pouch_size INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE order_products ALTER COLUMN pouch_size DROP DEFAULT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_products' AND column_name = 'number_of_pouches') THEN
    ALTER TABLE order_products ADD COLUMN number_of_pouches INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE order_products ALTER COLUMN number_of_pouches DROP DEFAULT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_products' AND column_name = 'total_weight') THEN
    ALTER TABLE order_products ADD COLUMN total_weight NUMERIC(10,2) NOT NULL DEFAULT 0;
    ALTER TABLE order_products ALTER COLUMN total_weight DROP DEFAULT;
  END IF;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_order_products_order_id ON order_products(order_id);
CREATE INDEX IF NOT EXISTS idx_order_products_product_id ON order_products(product_id);

-- Drop the constraint if it exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_order_status;

-- Add check constraint for status
ALTER TABLE orders
  ADD CONSTRAINT check_order_status
  CHECK (status IN ('NEW', 'IN PROGRESS', 'SHIPPED', 'DELIVERED', 'BILLED', 'COMPLETE'));

-- Add RLS (Row Level Security) policies for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view orders" ON orders;
DROP POLICY IF EXISTS "Allow admin users to insert orders" ON orders;
DROP POLICY IF EXISTS "Allow admin users to update orders" ON orders;
DROP POLICY IF EXISTS "Allow admin users to delete orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to view order_products" ON order_products;
DROP POLICY IF EXISTS "Allow admin users to insert order_products" ON order_products;
DROP POLICY IF EXISTS "Allow admin users to update order_products" ON order_products;
DROP POLICY IF EXISTS "Allow admin users to delete order_products" ON order_products;

-- Create policy to allow all authenticated users to view orders
CREATE POLICY "Allow authenticated users to view orders"
    ON orders
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy to allow only admin users to insert orders
CREATE POLICY "Allow admin users to insert orders"
    ON orders
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

-- Create policy to allow only admin users to update orders
CREATE POLICY "Allow admin users to update orders"
    ON orders
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

-- Create policy to allow only admin users to delete orders
CREATE POLICY "Allow admin users to delete orders"
    ON orders
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

-- Create policy to allow all authenticated users to view order_products
CREATE POLICY "Allow authenticated users to view order_products"
    ON order_products
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy to allow only admin users to insert order_products
CREATE POLICY "Allow admin users to insert order_products"
    ON order_products
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

-- Create policy to allow only admin users to update order_products
CREATE POLICY "Allow admin users to update order_products"
    ON order_products
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

-- Create policy to allow only admin users to delete order_products
CREATE POLICY "Allow admin users to delete order_products"
    ON order_products
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

-- Create function to update updated_at timestamp for orders
CREATE OR REPLACE FUNCTION update_orders_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_updated_at_column();
