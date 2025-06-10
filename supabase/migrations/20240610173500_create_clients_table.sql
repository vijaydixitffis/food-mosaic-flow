-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create clients table (without foreign keys initially)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    registered_office_address_id UUID NOT NULL,
    bill_to_address_id UUID,
    ship_to_address_id UUID,
    gst_number TEXT,
    is_igst BOOLEAN DEFAULT FALSE,
    company_registration_number TEXT,
    office_phone_number TEXT,
    contact_person1_name TEXT,
    contact_person1_phone TEXT,
    contact_person2_name TEXT,
    contact_person2_phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    CONSTRAINT valid_phone_number CHECK (
        office_phone_number ~ '^[0-9]{10,15}$' AND
        (contact_person1_phone IS NULL OR contact_person1_phone ~ '^[0-9]{10,15}$') AND
        (contact_person2_phone IS NULL OR contact_person2_phone ~ '^[0-9]{10,15}$')
    ),
    CONSTRAINT valid_gst_number CHECK (
        gst_number IS NULL OR 
        gst_number ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
    )
);

-- Add foreign key constraints
ALTER TABLE public.clients 
    ADD CONSTRAINT fk_registered_office_address 
    FOREIGN KEY (registered_office_address_id) 
    REFERENCES public.addresses(id);

ALTER TABLE public.clients 
    ADD CONSTRAINT fk_bill_to_address 
    FOREIGN KEY (bill_to_address_id) 
    REFERENCES public.addresses(id);

ALTER TABLE public.clients 
    ADD CONSTRAINT fk_ship_to_address 
    FOREIGN KEY (ship_to_address_id) 
    REFERENCES public.addresses(id);

-- Add comments
COMMENT ON TABLE public.clients IS 'Stores client/customer information';
COMMENT ON COLUMN public.clients.client_code IS 'Unique identifier for the client';
COMMENT ON COLUMN public.clients.name IS 'Legal name of the client company';
COMMENT ON COLUMN public.clients.gst_number IS '15-digit GSTIN number';
COMMENT ON COLUMN public.clients.is_igst IS 'Flag indicating if inter-state GST is applicable';
COMMENT ON COLUMN public.clients.company_registration_number IS 'Company registration number (CIN/LLPIN)';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_client_code ON public.clients(client_code);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_gst_number ON public.clients(gst_number) WHERE gst_number IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow all authenticated users to view active clients
CREATE POLICY "Enable read access for all authenticated users"
ON public.clients
FOR SELECT
TO authenticated
USING (is_active = true);

-- Allow only admins to insert/update/delete clients
CREATE POLICY "Enable insert for admins only"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable update for admins only"
ON public.clients
FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable delete for admins only"
ON public.clients
FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_client_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER handle_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create function to set created_by and updated_by
CREATE OR REPLACE FUNCTION public.handle_client_audit()
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

CREATE TRIGGER handle_client_audit
BEFORE INSERT OR UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.handle_client_audit();

-- Create secure view for client details with addresses
CREATE OR REPLACE VIEW public.client_details 
with(security_invoker=true)
AS
SELECT 
    c.id,
    c.client_code,
    c.name,
    c.gst_number,
    c.is_igst,
    c.company_registration_number,
    c.office_phone_number,
    c.contact_person1_name,
    c.contact_person1_phone,
    c.contact_person2_name,
    c.contact_person2_phone,
    c.is_active,
    c.created_at,
    c.updated_at,
    -- Registered Office Address
    reg.id AS registered_office_address_id,
    reg.address_type AS registered_office_address_type,
    reg.address_line1 AS registered_office_address_line1,
    reg.address_line2 AS registered_office_address_line2,
    reg.landmark AS registered_office_landmark,
    reg.city AS registered_office_city,
    reg.state AS registered_office_state,
    reg.pincode AS registered_office_pincode,
    -- Billing Address
    bill.id AS billing_address_id,
    bill.address_type AS billing_address_type,
    bill.address_line1 AS billing_address_line1,
    bill.address_line2 AS billing_address_line2,
    bill.landmark AS billing_landmark,
    bill.city AS billing_city,
    bill.state AS billing_state,
    bill.pincode AS billing_pincode,
    -- Shipping Address
    ship.id AS shipping_address_id,
    ship.address_type AS shipping_address_type,
    ship.address_line1 AS shipping_address_line1,
    ship.address_line2 AS shipping_address_line2,
    ship.landmark AS shipping_landmark,
    ship.city AS shipping_city,
    ship.state AS shipping_state,
    ship.pincode AS shipping_pincode,
    -- Add created_by for RLS
    c.created_by
FROM 
    public.clients c
    LEFT JOIN public.addresses reg ON c.registered_office_address_id = reg.id
    LEFT JOIN public.addresses bill ON c.bill_to_address_id = bill.id
    LEFT JOIN public.addresses ship ON c.ship_to_address_id = ship.id
WHERE c.is_active = true;

-- Grant permissions without changing ownership
GRANT SELECT ON public.client_details TO authenticated;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  );
$$;

-- Grant necessary permissions
GRANT SELECT ON public.client_details TO authenticated;
GRANT ALL ON public.clients TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
