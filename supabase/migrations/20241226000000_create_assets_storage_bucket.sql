-- Create assets storage bucket for company logos and other files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'assets',
    'assets',
    true,
    10485760, -- 10MB file size limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the assets bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin users to upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin users to update assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin users to delete assets" ON storage.objects;

-- Create policy to allow all authenticated users to view assets
CREATE POLICY "Allow authenticated users to view assets"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'assets');

-- Create policy to allow only admin users to upload assets
CREATE POLICY "Allow admin users to upload assets"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'assets' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.active = true
        )
    );

-- Create policy to allow only admin users to update assets
CREATE POLICY "Allow admin users to update assets"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'assets' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.active = true
        )
    );

-- Create policy to allow only admin users to delete assets
CREATE POLICY "Allow admin users to delete assets"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'assets' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.active = true
        )
    );
