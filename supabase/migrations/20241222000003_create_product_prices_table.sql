-- Create product_prices table for category-specific pricing
CREATE TABLE IF NOT EXISTS product_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  sale_price DECIMAL(10, 2) NOT NULL CHECK (sale_price >= 0),
  stock DECIMAL(10, 2) ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(product_id, category_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_prices_product_id ON product_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_category_id ON product_prices(category_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_prices_updated_at 
  BEFORE UPDATE ON product_prices 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

  -- Alternative version that requires a sale price
CREATE OR REPLACE FUNCTION public.update_product_stock(
  p_product_id UUID,
  p_category_id UUID,
  p_stock_change INTEGER
) 
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock INTEGER;
  v_sale_price NUMERIC(10,2);
BEGIN
  -- Get current stock and sale price, fail if no sale price exists
  SELECT pp.stock, pp.sale_price
  INTO v_current_stock, v_sale_price
  FROM public.product_prices pp
  WHERE pp.product_id = p_product_id 
    AND pp.category_id = p_category_id;
  
  -- If no record exists with a sale price, raise an error
  IF v_sale_price IS NULL THEN
    RAISE EXCEPTION 'No sale price found for this product and category';
  END IF;
  
  -- Calculate new stock
  v_current_stock := COALESCE(v_current_stock, 0) + p_stock_change;
  
  -- Ensure stock doesn't go below 0
  IF v_current_stock < 0 THEN
    v_current_stock := 0;
  END IF;
  
  -- Update the record
  UPDATE public.product_prices
  SET 
    stock = v_current_stock,
    updated_at = NOW()
  WHERE product_id = p_product_id 
    AND category_id = p_category_id;
END;
$$;
