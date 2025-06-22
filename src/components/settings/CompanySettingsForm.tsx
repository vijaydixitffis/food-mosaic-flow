import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Save, Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type CompanySettings = Database['public']['Tables']['company_settings']['Row'];

interface CompanySettingsFormProps {
  settings: CompanySettings | null;
  isEditing: boolean;
  onSave: (settings: Partial<CompanySettings>) => void;
  isLoading: boolean;
}

export function CompanySettingsForm({
  settings,
  isEditing,
  onSave,
  isLoading,
}: CompanySettingsFormProps) {
  const [formData, setFormData] = useState<Partial<CompanySettings>>({
    company_name: '',
    registration_number: '',
    gst_number: '',
    contact_number: '',
    address: '',
    email: '',
    website: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || '',
        registration_number: settings.registration_number || '',
        gst_number: settings.gst_number || '',
        contact_number: settings.contact_number || '',
        address: settings.address || '',
        email: settings.email || '',
        website: settings.website || '',
      });
      setLogoPreview(settings.company_logo_url);
      setQrPreview(settings.qr_code_url);
    }
  }, [settings]);

  const handleInputChange = (field: keyof CompanySettings, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQrUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setQrFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setQrPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, company_logo_url: null }));
  };

  const removeQr = () => {
    setQrFile(null);
    setQrPreview(null);
    setFormData(prev => ({ ...prev, qr_code_url: null }));
  };

  const uploadImage = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error } = await supabase.storage
      .from('company-assets')
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from('company-assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const updatedData = { ...formData };

      // Upload logo if new file selected
      if (logoFile) {
        const logoUrl = await uploadImage(logoFile, 'logos');
        updatedData.company_logo_url = logoUrl;
      }

      // Upload QR code if new file selected
      if (qrFile) {
        const qrUrl = await uploadImage(qrFile, 'qr-codes');
        updatedData.qr_code_url = qrUrl;
      }

      onSave(updatedData);
    } catch (error) {
      console.error('Error uploading images:', error);
    }
  };

  const validateGstNumber = (gst: string) => {
    // Basic GST validation: 15 characters, 2 digits + 10 characters + 1 digit + 1 character
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst);
  };

  const validatePhoneNumber = (phone: string) => {
    // Basic phone validation: +91 followed by 10 digits
    const phoneRegex = /^\+91-[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Logo Section */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Company Logo</Label>
        <div className="flex items-center space-x-4">
          {logoPreview ? (
            <div className="relative">
              <img
                src={logoPreview}
                alt="Company Logo"
                className="w-24 h-24 object-contain border rounded-lg"
              />
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 p-1 h-6 w-6"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          ) : (
            <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}
          
          {isEditing && (
            <div className="flex flex-col space-y-2">
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Upload className="w-4 h-4" />
                  Upload Logo
                </div>
              </Label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <p className="text-sm text-gray-500">
                Recommended: 200x200px, PNG or JPG
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Company Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company_name">Company Name *</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => handleInputChange('company_name', e.target.value)}
            disabled={!isEditing}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="registration_number">Registration Number</Label>
          <Input
            id="registration_number"
            value={formData.registration_number || ''}
            onChange={(e) => handleInputChange('registration_number', e.target.value)}
            disabled={!isEditing}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gst_number">GST Number</Label>
          <Input
            id="gst_number"
            value={formData.gst_number || ''}
            onChange={(e) => handleInputChange('gst_number', e.target.value)}
            disabled={!isEditing}
            placeholder="e.g., 27ABCDE1234F1Z5"
          />
          {formData.gst_number && !validateGstNumber(formData.gst_number) && (
            <p className="text-sm text-red-500">Invalid GST number format</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_number">Contact Number</Label>
          <Input
            id="contact_number"
            value={formData.contact_number || ''}
            onChange={(e) => handleInputChange('contact_number', e.target.value)}
            disabled={!isEditing}
            placeholder="e.g., +91-9876543210"
          />
          {formData.contact_number && !validatePhoneNumber(formData.contact_number) && (
            <p className="text-sm text-red-500">Invalid phone number format</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address || ''}
          onChange={(e) => handleInputChange('address', e.target.value)}
          disabled={!isEditing}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            disabled={!isEditing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={formData.website || ''}
            onChange={(e) => handleInputChange('website', e.target.value)}
            disabled={!isEditing}
            placeholder="https://example.com"
          />
        </div>
      </div>

      {/* QR Code Section */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">QR Code</Label>
        <div className="flex items-center space-x-4">
          {qrPreview ? (
            <div className="relative">
              <img
                src={qrPreview}
                alt="QR Code"
                className="w-24 h-24 object-contain border rounded-lg"
              />
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={removeQr}
                  className="absolute -top-2 -right-2 p-1 h-6 w-6"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          ) : (
            <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}
          
          {isEditing && (
            <div className="flex flex-col space-y-2">
              <Label htmlFor="qr-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Upload className="w-4 h-4" />
                  Upload QR Code
                </div>
              </Label>
              <input
                id="qr-upload"
                type="file"
                accept="image/*"
                onChange={handleQrUpload}
                className="hidden"
              />
              <p className="text-sm text-gray-500">
                Recommended: 200x200px, PNG or JPG
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      {isEditing && (
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading || !formData.company_name}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </form>
  );
} 