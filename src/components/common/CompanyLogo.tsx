import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ImageIcon } from 'lucide-react';

interface CompanyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  className?: string;
  showName?: boolean;
}

export function CompanyLogo({ size = 'md', className = '', showName = true }: CompanyLogoProps) {
  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('company_name, company_logo_url')
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
  });

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-8 h-8';
      case 'md': return 'w-12 h-12';
      case 'lg': return 'w-16 h-16';
      case 'xl': return 'w-18 h-18';
      case 'custom': return ''; // Will use inline styles
      default: return 'w-12 h-12';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-sm';
      case 'md': return 'text-base';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      case 'custom': return 'text-lg'; // Larger text for header
      default: return 'text-base';
    }
  };

  const getCustomStyle = () => {
    if (size === 'custom') {
      return { width: '60px', height: '60px' }; // 15x15 = 60px (4px per unit)
    }
    return {};
  };

  if (!companySettings) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded ${getSizeClasses()} ${className}`}
        style={getCustomStyle()}
      >
        <ImageIcon className="w-1/2 h-1/2 text-gray-400" />
      </div>
    );
  }

  if (companySettings.company_logo_url) {
    // Use absolute URL for logo if src is relative
    const absoluteSrc = companySettings.company_logo_url.startsWith('http') ? companySettings.company_logo_url : `${window.location.origin}/${companySettings.company_logo_url.replace(/^\//, '')}`;
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <img
          src={absoluteSrc}
          alt={companySettings.company_name}
          className={`object-contain ${getSizeClasses()}`}
          style={{ maxWidth: '160px', height: '60px', objectFit: 'contain', display: 'block' }}
          onError={(e) => {
            // Fallback to text if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
        {showName && (
          <span className={`font-semibold text-gray-900 ${getTextSize()}`}>
            {companySettings.company_name}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded ${getSizeClasses()}`}
        style={getCustomStyle()}
      >
        <ImageIcon className="w-1/2 h-1/2 text-gray-400" />
      </div>
      {showName && (
        <span className={`font-semibold text-gray-900 ${getTextSize()}`}>
          {companySettings.company_name}
        </span>
      )}
    </div>
  );
} 