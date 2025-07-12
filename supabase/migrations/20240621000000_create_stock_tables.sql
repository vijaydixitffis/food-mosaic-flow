-- Create the ingredient_stock table
CREATE TABLE ingredient_stock (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id uuid REFERENCES ingredients(id),
    quantity DECIMAL(10, 2) NOT NULL,
    unit_of_measure TEXT,
    location TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the product_stock table
CREATE TABLE product_stock (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id uuid REFERENCES products(id),
    quantity DECIMAL(10, 2) NOT NULL,
    location TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the stock_allocation table
CREATE TABLE stock_allocation (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_item_id uuid, -- This will reference either ingredient_stock or product_stock
    item_type TEXT CHECK (item_type IN ('ingredient', 'product')),
    reference_id uuid, -- This will reference either work_orders or orders
    reference_type TEXT CHECK (reference_type IN ('work_order', 'order')),
    quantity_allocated DECIMAL(10, 2) NOT NULL,
    allocation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for the new tables (example policies, adjust as needed)

-- Enable RLS on tables
ALTER TABLE ingredient_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_allocation ENABLE ROW LEVEL SECURITY;

-- Policy for everyone to read stock (adjust if only administrators should read)
CREATE POLICY select_ingredient_stock ON ingredient_stock FOR SELECT USING (true);
CREATE POLICY select_product_stock ON product_stock FOR SELECT USING (true);
CREATE POLICY select_stock_allocation ON stock_allocation FOR SELECT USING (true);

-- Policy for administrators to insert, update, and delete stock (adjust role name if necessary)
CREATE POLICY manage_ingredient_stock ON ingredient_stock FOR ALL USING (auth.jwt() ->> 'user_role' = 'administrator');
CREATE POLICY manage_product_stock ON product_stock FOR ALL USING (auth.jwt() ->> 'user_role' = 'administrator');
CREATE POLICY manage_stock_allocation ON stock_allocation FOR ALL USING (auth.jwt() ->> 'user_role' = 'administrator');