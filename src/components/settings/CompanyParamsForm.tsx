import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Plus, Trash2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type CompanyParams = Database['public']['Tables']['company_params']['Row'];

interface CompanyParamsFormProps {
  isEditing: boolean;
}

export function CompanyParamsForm({ isEditing }: CompanyParamsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [params, setParams] = useState<CompanyParams[]>([]);
  const [newParam, setNewParam] = useState({ key: '', value: '', flag: false });

  // Fetch company params
  const { data: companyParams, isLoading } = useQuery({
    queryKey: ['company-params'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_params')
        .select('*')
        .order('key');

      if (error) {
        throw error;
      }

      return data || [];
    },
  });

  // Update params mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedParams: CompanyParams[]) => {
      const promises = updatedParams.map(param =>
        supabase
          .from('company_params')
          .update({ key: param.key, value: param.value, flag: param.flag })
          .eq('id', param.id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw errors[0].error;
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-params'] });
      toast({
        title: 'Success',
        description: 'Company parameters updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update company parameters.',
        variant: 'destructive',
      });
    },
  });

  // Add new param mutation
  const addMutation = useMutation({
    mutationFn: async (param: Omit<CompanyParams, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('company_params')
        .insert(param)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-params'] });
      toast({
        title: 'Success',
        description: 'Company parameter added successfully.',
      });
      setNewParam({ key: '', value: '', flag: false });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add company parameter.',
        variant: 'destructive',
      });
    },
  });

  // Delete param mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('company_params')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-params'] });
      toast({
        title: 'Success',
        description: 'Company parameter deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete company parameter.',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (companyParams) {
      setParams(companyParams);
    }
  }, [companyParams]);

  const handleParamChange = (id: string, field: keyof CompanyParams, value: string | boolean) => {
    setParams(prev => 
      prev.map(param => 
        param.id === id ? { ...param, [field]: value } : param
      )
    );
  };

  const handleAddParam = () => {
    if (newParam.key.trim()) {
      addMutation.mutate({
        key: newParam.key.trim(),
        value: newParam.value.trim(),
        flag: newParam.flag,
      });
    }
  };

  const handleDeleteParam = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleSave = () => {
    updateMutation.mutate(params);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Company Parameters</h3>
          <p className="text-sm text-gray-600">
            Additional company information for invoices and documents.
          </p>
        </div>
        {isEditing && (
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      {/* Existing Parameters */}
      <div className="space-y-4">
        {params.map((param) => (
          <Card key={param.id}>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-3">
                  <Label htmlFor={`key-${param.id}`}>Parameter Name</Label>
                  <Input
                    id={`key-${param.id}`}
                    value={param.key}
                    onChange={(e) => handleParamChange(param.id, 'key', e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g., pan_number"
                  />
                </div>
                <div className="md:col-span-6">
                  <Label htmlFor={`value-${param.id}`}>Value</Label>
                  <Input
                    id={`value-${param.id}`}
                    value={param.value || ''}
                    onChange={(e) => handleParamChange(param.id, 'value', e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g., ABCDE1234F"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-2 mt-6">
                    <Checkbox
                      id={`flag-${param.id}`}
                      checked={param.flag}
                      onCheckedChange={(checked) => handleParamChange(param.id, 'flag', checked as boolean)}
                      disabled={!isEditing}
                    />
                    <Label htmlFor={`flag-${param.id}`} className="text-sm">
                      Show on Invoice
                    </Label>
                  </div>
                </div>
                <div className="md:col-span-1">
                  {isEditing && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteParam(param.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Parameter */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="w-4 h-4" />
              Add New Parameter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-3">
                <Label htmlFor="new-key">Parameter Name</Label>
                <Input
                  id="new-key"
                  value={newParam.key}
                  onChange={(e) => setNewParam(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="e.g., bank_name"
                />
              </div>
              <div className="md:col-span-6">
                <Label htmlFor="new-value">Value</Label>
                <Input
                  id="new-value"
                  value={newParam.value}
                  onChange={(e) => setNewParam(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="e.g., State Bank of India"
                />
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="new-flag"
                    checked={newParam.flag}
                    onCheckedChange={(checked) => setNewParam(prev => ({ ...prev, flag: checked as boolean }))}
                  />
                  <Label htmlFor="new-flag" className="text-sm">
                    Show on Invoice
                  </Label>
                </div>
              </div>
              <div className="md:col-span-1">
                <Button
                  type="button"
                  onClick={handleAddParam}
                  disabled={!newParam.key.trim() || addMutation.isPending}
                  className="w-full"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
