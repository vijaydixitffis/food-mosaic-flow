import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Save, Upload, Image as ImageIcon, Building2 } from 'lucide-react';
import { CompanySettingsForm } from './CompanySettingsForm';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type CompanySettings = Database['public']['Tables']['company_settings']['Row'];

export function CompanySettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch company settings
  const { data: companySettings, isLoading, error } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      console.log('Fetching company settings...');
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      console.log('Company settings query result:', { data, error });
      
      // If no rows found, return null instead of throwing error
      if (error && (error as any).code === 'PGRST116') {
        console.log('No company settings found, returning null for setup');
        return null;
      }
      
      if (error) {
        console.error('Error fetching company settings:', error);
        throw error;
      }

      return data;
    },
  });

  // Create company settings mutation (for initial setup)
  const createMutation = useMutation({
    mutationFn: async (settings: Partial<CompanySettings>) => {
      const { data, error } = await supabase
        .from('company_settings')
        .insert(settings)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast({
        title: 'Success',
        description: 'Company settings created successfully.',
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create company settings.',
        variant: 'destructive',
      });
    },
  });

  // Update company settings mutation
  const updateMutation = useMutation({
    mutationFn: async (settings: Partial<CompanySettings>) => {
      const { data, error } = await supabase
        .from('company_settings')
        .update(settings)
        .eq('id', companySettings?.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast({
        title: 'Success',
        description: 'Company settings updated successfully.',
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update company settings.',
        variant: 'destructive',
      });
    },
  });

  const handleSave = (settings: Partial<CompanySettings>) => {
    if (companySettings) {
      // Update existing settings
      updateMutation.mutate(settings);
    } else {
      // Create new settings
      createMutation.mutate(settings);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle case where no company settings exist (initial setup)
  if (!companySettings && !error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Setup</h1>
            <p className="text-gray-600 mt-1">
              Welcome! Let's set up your company information to get started.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Initial Company Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Setup Required</h3>
              <p className="text-blue-700 text-sm">
                Please provide your company information to complete the setup. This information will be used throughout the application for invoices, branding, and contact details.
              </p>
            </div>
            
            <CompanySettingsForm
              settings={null}
              isEditing={true}
              onSave={handleSave}
              isLoading={createMutation.isPending}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle actual errors
  if (error && (error as any).code !== 'PGRST116') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Error loading company settings. Please try again.
            </div>
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-semibold mb-2">Debug Info:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify({ error, companySettings }, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Normal company settings view/edit
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your company branding and contact information
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "outline" : "default"}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {isEditing ? 'Cancel' : 'Edit Settings'}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CompanySettingsForm
            settings={companySettings}
            isEditing={isEditing}
            onSave={handleSave}
            isLoading={updateMutation.isPending}
          />
          
          {/* Debug Section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Debug: Raw Company Settings Data</h3>
            <pre className="text-xs text-gray-600 overflow-auto max-h-40">
              {JSON.stringify(companySettings, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>

      {!isAdmin && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-600">
              Only administrators can modify company settings.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 