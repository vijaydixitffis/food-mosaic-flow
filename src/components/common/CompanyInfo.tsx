import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CompanyLogo } from './CompanyLogo';

interface CompanyInfoProps {
  variant?: 'compact' | 'full' | 'invoice';
  className?: string;
}

export function CompanyInfo({ variant = 'full', className = '' }: CompanyInfoProps) {
  console.log('CompanyInfo component rendered with variant:', variant);
  
  const { data: companySettings, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      console.log('CompanyInfo: Starting to fetch company settings...');
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      console.log('CompanyInfo: Supabase query result:', { data, error });

      // If no rows found, return null instead of throwing error
      if (error && (error as any).code === 'PGRST116') {
        console.log('CompanyInfo: No company settings found, returning null');
        return null;
      }
      
      if (error) {
        console.error('CompanyInfo: Error fetching company settings:', error);
        throw error;
      }

      console.log('CompanyInfo: Successfully fetched company settings:', data);
      return data;
    },
    retry: 1, // Only retry once
    staleTime: 0, // Data is immediately stale, so it will refetch when needed
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection time
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch when component mounts
  });

  // Auto-refetch when invoice variant is rendered to ensure fresh data
  React.useEffect(() => {
    if (variant === 'invoice') {
      console.log('CompanyInfo: Invoice variant detected, ensuring fresh data...');
      refetch();
    }
  }, [variant, refetch]);

  // Fallback company settings if database query fails
  const fallbackSettings = {
    company_name: 'FoodMosaic ERP',
    address: '',
    registration_number: '',
    gst_number: '',
    contact_number: '',
    email: '',
    website: '',
  };

  // Use fallback if no data or error
  const settings = companySettings || fallbackSettings;

  // Debug: Log the full settings object and field status
  console.log('CompanyInfo: Full company settings object:', JSON.stringify(settings, null, 2));
  console.log('CompanyInfo: Field status:', {
    company_name: !!settings.company_name,
    registration_number: !!settings.registration_number,
    gst_number: !!settings.gst_number,
    contact_number: !!settings.contact_number,
    address: !!settings.address,
    email: !!settings.email,
    website: !!settings.website,
  });
  console.log('CompanyInfo: Query state:', { isLoading, isFetching, error, hasData: !!companySettings });

  if (isLoading) {
    console.log('CompanyInfo: Showing loading state');
    return (
      <div className={`text-gray-500 ${className}`}>
        Loading company information...
      </div>
    );
  }

  if (error) {
    console.error('CompanyInfo: Error state:', error);
  }

  if (variant === 'compact') {
    console.log('CompanyInfo: Rendering compact variant');
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="font-semibold text-gray-900">
          {settings.company_name}
        </div>
        {settings.address && (
          <div className="text-sm text-gray-600">
            {settings.address}
          </div>
        )}
        {settings.contact_number && (
          <div className="text-sm text-gray-600">
            {settings.contact_number}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'invoice') {
    console.log('CompanyInfo: Rendering invoice variant');
    console.log('CompanyInfo: Invoice variant settings:', {
      company_name: settings.company_name,
      address: settings.address,
      registration_number: settings.registration_number,
      gst_number: settings.gst_number,
      contact_number: settings.contact_number,
      email: settings.email,
    });
    
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-start space-x-3">
          <CompanyLogo size="lg" showName={false} />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {settings.company_name}
            </h2>
            {settings.address && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {settings.address}
              </p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm border-t pt-3">
          {settings.registration_number && (
            <div className="flex flex-col">
              <span className="font-semibold text-gray-700 mb-1">Registration Number:</span>
              <span className="text-gray-600">{settings.registration_number}</span>
            </div>
          )}
          {settings.gst_number && (
            <div className="flex flex-col">
              <span className="font-semibold text-gray-700 mb-1">GST Number:</span>
              <span className="text-gray-600">{settings.gst_number}</span>
            </div>
          )}
          {settings.contact_number && (
            <div className="flex flex-col">
              <span className="font-semibold text-gray-700 mb-1">Contact Number:</span>
              <span className="text-gray-600">{settings.contact_number}</span>
            </div>
          )}
          {settings.email && (
            <div className="flex flex-col">
              <span className="font-semibold text-gray-700 mb-1">Email:</span>
              <span className="text-gray-600">{settings.email}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full variant
  console.log('CompanyInfo: Rendering full variant');
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-start space-x-4">
        <CompanyLogo size="lg" showName={false} />
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            {settings.company_name}
          </h2>
          {settings.address && (
            <p className="text-gray-600 mt-1">
              {settings.address}
            </p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settings.registration_number && (
          <div>
            <span className="font-medium text-gray-700">Registration Number:</span>
            <span className="ml-2 text-gray-600">{settings.registration_number}</span>
          </div>
        )}
        {settings.gst_number && (
          <div>
            <span className="font-medium text-gray-700">GST Number:</span>
            <span className="ml-2 text-gray-600">{settings.gst_number}</span>
          </div>
        )}
        {settings.contact_number && (
          <div>
            <span className="font-medium text-gray-700">Contact Number:</span>
            <span className="ml-2 text-gray-600">{settings.contact_number}</span>
          </div>
        )}
        {settings.email && (
          <div>
            <span className="font-medium text-gray-700">Email:</span>
            <span className="ml-2 text-gray-600">{settings.email}</span>
          </div>
        )}
        {settings.website && (
          <div>
            <span className="font-medium text-gray-700">Website:</span>
            <a 
              href={settings.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              {settings.website}
            </a>
          </div>
        )}
      </div>
    </div>
  );
} 