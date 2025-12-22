import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Category = Database['public']['Tables']['categories']['Row'];

interface CategoriesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSuccess: (category: Partial<Category>) => void;
  isReadOnly?: boolean;
}

export function CategoriesDialog({ 
  isOpen, 
  onClose, 
  category, 
  onSuccess, 
  isReadOnly = false 
}: CategoriesDialogProps) {
  const [formData, setFormData] = useState({
    category_code: '',
    category_name: '',
    sequence: 0,
    is_active: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (category) {
      setFormData({
        category_code: category.category_code,
        category_name: category.category_name,
        sequence: category.sequence,
        is_active: category.is_active
      });
    } else {
      setFormData({
        category_code: '',
        category_name: '',
        sequence: 0,
        is_active: true
      });
    }
    setErrors({});
  }, [category, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate category code
    if (!formData.category_code.trim()) {
      newErrors.category_code = 'Category code is required';
    } else if (formData.category_code.length !== 5) {
      newErrors.category_code = 'Category code must be exactly 5 characters';
    } else if (!/^[A-Za-z0-9]{5}$/.test(formData.category_code)) {
      newErrors.category_code = 'Category code must be alphanumeric (letters and numbers only)';
    }

    // Validate category name
    if (!formData.category_name.trim()) {
      newErrors.category_name = 'Category name is required';
    } else if (formData.category_name.trim().length < 2) {
      newErrors.category_name = 'Category name must be at least 2 characters';
    }

    // Validate sequence
    if (formData.sequence < 0) {
      newErrors.sequence = 'Sequence must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      category_code: formData.category_code.toUpperCase(),
      category_name: formData.category_name.trim(),
      sequence: formData.sequence,
      is_active: formData.is_active
    };

    onSuccess(submitData);
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isReadOnly ? 'View Category' : (category ? 'Edit Category' : 'Add New Category')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category_code">Category Code</Label>
            <Input
              id="category_code"
              value={formData.category_code}
              onChange={(e) => handleInputChange('category_code', e.target.value)}
              placeholder="e.g., BEV01"
              disabled={isReadOnly}
              className={errors.category_code ? 'border-red-500' : ''}
              maxLength={5}
            />
            {errors.category_code && (
              <p className="text-sm text-red-500">{errors.category_code}</p>
            )}
            <p className="text-xs text-gray-500">
              5-character alphanumeric code (e.g., BEV01)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_name">Category Name</Label>
            <Input
              id="category_name"
              value={formData.category_name}
              onChange={(e) => handleInputChange('category_name', e.target.value)}
              placeholder="e.g., Beverages"
              disabled={isReadOnly}
              className={errors.category_name ? 'border-red-500' : ''}
            />
            {errors.category_name && (
              <p className="text-sm text-red-500">{errors.category_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sequence">Sequence</Label>
            <Input
              id="sequence"
              type="number"
              min="0"
              value={formData.sequence}
              onChange={(e) => handleInputChange('sequence', parseInt(e.target.value) || 0)}
              placeholder="0"
              disabled={isReadOnly}
              className={errors.sequence ? 'border-red-500' : ''}
            />
            {errors.sequence && (
              <p className="text-sm text-red-500">{errors.sequence}</p>
            )}
            <p className="text-xs text-gray-500">
              Order in which categories will be displayed (lower numbers appear first)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                disabled={isReadOnly}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <p className="text-xs text-gray-500">
              Inactive categories won't be available for selection
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button type="submit">
                {category ? 'Update' : 'Create'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
