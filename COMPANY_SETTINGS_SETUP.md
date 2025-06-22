# Company Settings Feature Setup Guide

This guide explains how to set up the company branding and settings feature in FoodMosaic ERP.

## Overview

The company settings feature allows administrators to configure:
- Company logo
- Company name and contact information
- Registration number and GST number
- QR code image
- Address and website

## Database Setup

### 1. Run the SQL Script

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/setup-company-settings.sql`
4. Execute the script

This will create:
- `company_settings` table
- Row Level Security (RLS) policies
- Default company record
- Storage bucket for company assets

### 2. Create Storage Bucket

1. Go to Storage section in Supabase Dashboard
2. Create a new bucket named `company-assets`
3. Set the following options:
   - **Public bucket**: ✅ Enabled
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/*`

## Frontend Components

The following components have been created:

### Core Components
- `CompanySettingsPage.tsx` - Main settings management page
- `CompanySettingsForm.tsx` - Form for editing company information
- `CompanyLogo.tsx` - Reusable logo component
- `CompanyInfo.tsx` - Reusable company information display

### Integration Points
- Updated `AppSidebar.tsx` - Added Settings menu item
- Updated `DashboardContent.tsx` - Added settings page routing
- Updated `DashboardHeader.tsx` - Added company logo display
- Updated `Invoice.tsx` - Integrated company information

## Features

### Admin-Only Access
- Only users with `admin` role can modify company settings
- All authenticated users can view company information
- Secure image upload with file type validation

### Image Management
- Support for logo and QR code uploads
- Automatic image preview
- File type validation (PNG, JPG, SVG)
- Fallback handling for missing images

### Validation
- GST number format validation
- Phone number format validation
- Required field validation

### Responsive Design
- Mobile-friendly interface
- Responsive image sizing
- Adaptive layout for different screen sizes

## Usage

### For Administrators

1. **Access Settings**: Click on "Settings" in the sidebar
2. **Edit Information**: Click "Edit Settings" button
3. **Upload Images**: Use the upload buttons for logo and QR code
4. **Save Changes**: Click "Save Changes" to update

### For All Users

- Company logo appears in the dashboard header
- Company information is automatically included in invoices
- Consistent branding across the application

## File Structure

```
src/
├── components/
│   ├── settings/
│   │   ├── CompanySettingsPage.tsx
│   │   └── CompanySettingsForm.tsx
│   └── common/
│       ├── CompanyLogo.tsx
│       └── CompanyInfo.tsx
├── integrations/supabase/
│   └── types.ts (updated)
└── supabase/
    ├── migrations/
    │   └── 20240618000000_create_company_settings_table.sql
    └── setup-company-settings.sql
```

## Security Considerations

- **Row Level Security**: All database operations are protected
- **Admin-Only Modifications**: Only admin users can update settings
- **File Upload Security**: Image files are validated and stored securely
- **Public Read Access**: Company information is readable by all authenticated users

## Troubleshooting

### Common Issues

1. **Images not uploading**: Check storage bucket permissions
2. **Settings not saving**: Verify admin role permissions
3. **Logo not displaying**: Check image URL and file format

### Database Issues

If the migration fails:
1. Check if the `profiles` table exists
2. Verify RLS policies are properly configured
3. Ensure the storage bucket is created

## Future Enhancements

Potential improvements:
- Image cropping and resizing
- Multiple logo variants (light/dark themes)
- Company document templates
- Brand color customization
- Multi-language support

## Support

For issues or questions:
1. Check the Supabase logs for database errors
2. Verify browser console for frontend errors
3. Ensure all dependencies are installed
4. Check network connectivity for image uploads 