-- Update existing company settings with missing fields
-- Run this in your Supabase SQL Editor

UPDATE company_settings 
SET 
    registration_number = 'REG123456789',
    gst_number = '27ABCDE1234F1Z5',
    contact_number = '+91-9876543210',
    address = '123 Food Street, Manufacturing District, City - 123456',
    email = 'info@mimasafoods.com',
    website = 'https://mimasafoods.com',
    updated_at = TIMEZONE('utc'::text, NOW())
WHERE company_name = 'Mimasa Foods Pvt Ltd';

-- Verify the update
SELECT * FROM company_settings; 