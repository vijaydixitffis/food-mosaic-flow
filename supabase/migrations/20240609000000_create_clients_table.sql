-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    office_address TEXT NOT NULL,
    company_registration_number VARCHAR(50) NOT NULL,
    office_phone_number VARCHAR(20) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    contact_person_phone_number VARCHAR(20) NOT NULL,
    gst_number VARCHAR(15) NOT NULL,
    is_igst BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on client_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_client_code ON clients(client_code);

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- Create index on is_active for filtering active/inactive clients
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);

-- Add RLS (Row Level Security) policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view clients" ON clients;
DROP POLICY IF EXISTS "Allow admin users to insert clients" ON clients;
DROP POLICY IF EXISTS "Allow admin users to update clients" ON clients;
DROP POLICY IF EXISTS "Allow admin users to delete clients" ON clients;

-- Create policy to allow all authenticated users to view clients
CREATE POLICY "Allow authenticated users to view clients"
    ON clients
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy to allow only admin users to insert clients
CREATE POLICY "Allow admin users to insert clients"
    ON clients
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

-- Create policy to allow only admin users to update clients
CREATE POLICY "Allow admin users to update clients"
    ON clients
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

-- Create policy to allow only admin users to delete clients
CREATE POLICY "Allow admin users to delete clients"
    ON clients
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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 