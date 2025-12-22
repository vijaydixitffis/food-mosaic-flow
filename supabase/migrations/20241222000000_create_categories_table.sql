-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code VARCHAR(5) NOT NULL UNIQUE,
  category_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT categories_category_code_length CHECK (LENGTH(category_code) = 5),
  CONSTRAINT categories_category_code_format CHECK (category_code ~ '^[A-Za-z0-9]{5}$')
);

-- Create index on category_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_category_code ON categories(category_code);

-- Create index on is_active for filtering active categories
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE
  ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add sequence column to categories table
ALTER TABLE categories 
ADD COLUMN sequence INTEGER NOT NULL DEFAULT 0;

-- Create index on sequence for ordering
CREATE INDEX IF NOT EXISTS idx_categories_sequence ON categories(sequence);

-- Insert default categories
INSERT INTO "public"."categories" ("id", "category_code", "category_name", "is_active", "created_at", "updated_at", "sequence") VALUES ('062cea62-50ff-42ad-83ce-c4580461f10c', 'B2C01', 'B2C Cash', 'true', '2025-12-22 07:15:15.720711+00', '2025-12-22 12:27:45.28209+00', '7'), ('08d4fd6c-84b0-4a2b-bb37-44fe6374bb22', 'WHTLB', 'White Lable', 'true', '2025-12-22 07:15:15.720711+00', '2025-12-22 12:26:59.339722+00', '4'), ('0a927b78-c754-45e7-90d8-f025c02dbc8b', 'HRC01', 'HoReCa', 'true', '2025-12-22 07:15:15.720711+00', '2025-12-22 12:20:12.300309+00', '2'), ('0b553b50-02f7-4dea-aa72-1df762509a6e', 'SMPLE', 'Samples', 'true', '2025-12-22 07:15:15.720711+00', '2025-12-22 12:26:06.732188+00', '6'), ('179932c8-098f-4a65-ab91-12ffa6040d9c', 'TRY01', 'Trials', 'true', '2025-12-22 07:15:15.720711+00', '2025-12-22 12:28:12.849817+00', '8'), ('2bd7c6bf-f7b7-4b0b-ae20-06f15bb51c89', 'RET01', 'Retail', 'true', '2025-12-22 07:15:15.720711+00', '2025-12-22 12:18:40.27371+00', '1'), ('324dae2c-d905-474a-9e4a-24e294b42e5c', 'B2B01', 'B2B Large', 'true', '2025-12-22 07:15:15.720711+00', '2025-12-22 12:27:14.500709+00', '5'), ('5fe79c17-2ce9-43fe-96a6-cbaac77faed4', 'B2B02', 'B2B Small Medium', 'true', '2025-12-22 07:19:18.168644+00', '2025-12-22 12:27:26.410511+00', '6'), ('633f94ff-f5d8-4334-946d-3ac67250c865', 'GFT01', 'Gifts and Freebies', 'true', '2025-12-22 07:15:15.720711+00', '2025-12-22 12:28:01.25653+00', '99'), ('d8f08c0a-fd81-4e48-b3a3-743ce5a69995', 'OTH01', 'Others', 'true', '2025-12-22 07:15:15.720711+00', '2025-12-22 12:16:18.08501+00', '10');
