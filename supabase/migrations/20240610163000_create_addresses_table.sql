-- Create enum type for address type
CREATE TYPE address_type AS ENUM ('SHIPTO', 'BILLTO', 'REGD', 'COMM', 'BRANCH', 'PERSONAL', 'OTHER');

-- Create addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address_type address_type NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    landmark TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Add comments
COMMENT ON TABLE public.addresses IS 'Stores address information for various entities in the system';
COMMENT ON COLUMN public.addresses.address_type IS 'Type of address (SHIPTO, BILLTO, REGD, COMM, BRANCH, PERSONAL, OTHER)';
COMMENT ON COLUMN public.addresses.address_line1 IS 'First line of the address';
COMMENT ON COLUMN public.addresses.address_line2 IS 'Second line of the address (optional)';
COMMENT ON COLUMN public.addresses.landmark IS 'Landmark near the address (optional)';
COMMENT ON COLUMN public.addresses.city IS 'City name';
COMMENT ON COLUMN public.addresses.state IS 'State name';
COMMENT ON COLUMN public.addresses.pincode IS 'PIN code (6 digits for Indian addresses)';

-- Create indexes
CREATE INDEX idx_addresses_address_type ON public.addresses(address_type);
CREATE INDEX idx_addresses_city ON public.addresses(city);
CREATE INDEX idx_addresses_pincode ON public.addresses(pincode);

-- Enable Row Level Security
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Enable read access for all authenticated users"
ON public.addresses
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users only"
ON public.addresses
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for users based on created_by"
ON public.addresses
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER handle_addresses_updated_at
BEFORE UPDATE ON public.addresses
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create function to set created_by and updated_by
CREATE OR REPLACE FUNCTION public.handle_address_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_by = auth.uid();
        NEW.updated_by = auth.uid();
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER handle_address_audit
BEFORE INSERT OR UPDATE ON public.addresses
FOR EACH ROW
EXECUTE FUNCTION public.handle_address_audit();

-- Grant necessary permissions
GRANTANT ALL ON public.addresses TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
