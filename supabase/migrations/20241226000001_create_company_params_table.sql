-- Create company_params table for additional company information
CREATE TABLE IF NOT EXISTS company_params (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) NOT NULL,
    value TEXT,
    flag BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Add unique constraint on key to prevent duplicates
    CONSTRAINT unique_company_params_key UNIQUE (key)
);

-- Insert default company parameters
INSERT INTO company_params (key, value, flag) VALUES
    ('pan_number', 'ABCDE1234F', true),
    ('bank_name', 'State Bank of India', true),
    ('bank_account_number', '1234567890123456', false),
    ('bank_ifsc', 'SBIN0001234', true),
    ('bank_branch', 'Main Branch, City', false),
    ('terms_and_conditions', '1. Goods once sold will not be taken back.\n2. Payment should be made within 30 days.\n3. Interest will be charged on delayed payments.', true),
    ('declaration_text', 'We declare that this invoice shows the actual price of the goods described.', true),
    ('authorized_signatory', 'John Doe, Director', true)
ON CONFLICT (key) DO NOTHING;

-- Add RLS (Row Level Security) policies
ALTER TABLE company_params ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view company params" ON company_params;
DROP POLICY IF EXISTS "Allow admin users to insert company params" ON company_params;
DROP POLICY IF EXISTS "Allow admin users to update company params" ON company_params;
DROP POLICY IF EXISTS "Allow admin users to delete company params" ON company_params;

-- Create policy to allow all authenticated users to view company params
CREATE POLICY "Allow authenticated users to view company params"
    ON company_params
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy to allow only admin users to insert company params
CREATE POLICY "Allow admin users to insert company params"
    ON company_params
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

-- Create policy to allow only admin users to update company params
CREATE POLICY "Allow admin users to update company params"
    ON company_params
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

-- Create policy to allow only admin users to delete company params
CREATE POLICY "Allow admin users to delete company params"
    ON company_params
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

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_company_params_updated_at
    BEFORE UPDATE ON company_params
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
