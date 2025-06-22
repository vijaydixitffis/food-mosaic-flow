-- Company Settings Setup Script
-- Run this in your Supabase SQL Editor

-- 1. Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    company_logo_url TEXT,
    registration_number VARCHAR(100),
    gst_number VARCHAR(15),
    contact_number VARCHAR(20),
    qr_code_url TEXT,
    address TEXT,
    email VARCHAR(255),
    website VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Insert default company record
INSERT INTO company_settings (company_name, registration_number, gst_number, contact_number, address, email)
VALUES ('FoodMosaic ERP', 'REG123456789', '27ABCDE1234F1Z5', '+91-9876543210', '123 Food Street, Manufacturing District, City - 123456', 'info@foodmosaic.com')
ON CONFLICT DO NOTHING;

-- 3. Add RLS (Row Level Security) policies
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view company settings" ON company_settings;
DROP POLICY IF EXISTS "Allow admin users to insert company settings" ON company_settings;
DROP POLICY IF EXISTS "Allow admin users to update company settings" ON company_settings;
DROP POLICY IF EXISTS "Allow admin users to delete company settings" ON company_settings;

-- Create policy to allow all authenticated users to view company settings
CREATE POLICY "Allow authenticated users to view company settings"
    ON company_settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy to allow only admin users to insert company settings
CREATE POLICY "Allow admin users to insert company settings"
    ON company_settings
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

-- Create policy to allow only admin users to update company settings
CREATE POLICY "Allow admin users to update company settings"
    ON company_settings
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

-- Create policy to allow only admin users to delete company settings
CREATE POLICY "Allow admin users to delete company settings"
    ON company_settings
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

-- 4. Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON company_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Create storage bucket for company assets (run this in Storage section)
-- Note: You'll need to create the 'company-assets' bucket manually in the Storage section
-- with the following settings:
-- - Public bucket: true
-- - File size limit: 5MB
-- - Allowed MIME types: image/*

-- 6. Storage bucket policies (run these after creating the bucket)
-- Allow authenticated users to upload images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('company-assets', 'company-assets', true, 5242880, ARRAY['image/*'])
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to view company assets
CREATE POLICY "Allow authenticated users to view company assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'company-assets');

-- Allow admin users to upload company assets
CREATE POLICY "Allow admin users to upload company assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'company-assets' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.active = true
    )
);

-- Allow admin users to update company assets
CREATE POLICY "Allow admin users to update company assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'company-assets' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.active = true
    )
);

-- Allow admin users to delete company assets
CREATE POLICY "Allow admin users to delete company assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'company-assets' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.active = true
    )
); 