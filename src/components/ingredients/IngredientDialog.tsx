
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Ingredient } from './IngredientsPage';

interface IngredientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient?: Ingredient | null;
  isReadOnly?: boolean;
}

interface IngredientFormData {
  name: string;
  short_description: string;
  unit_of_measurement: string;
  rate: string;
  tags: string;
}

const UNIT_OPTIONS = [
  { value: 'KG', label: 'Kilogram (KG)' },
  { value: 'Gms', label: 'Grams (Gms)' },
  { value: 'Lit', label: 'Liter (Lit)' },
  { value: 'Mls', label: 'Milliliter (Mls)' },
  { value: 'Pack', label: 'Pack' },
  { value: 'Dozen', label: 'Dozen' },
  { value: 'Units', label: 'Number of Units' },
];

export function IngredientDialog({ isOpen, onClose, ingredient, isReadOnly = false }: IngredientDialogProps) {
  const [formData, setFormData] = useState<IngredientFormData>({
    name: '',
    short_description: '',
    unit_of_measurement: '',
    rate: '',
    tags: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (ingredient) {
      setFormData({
        name: ingredient.name,
        short_description: ingredient.short_description || '',
        unit_of_measurement: ingredient.unit_of_measurement || '',
        rate: ingredient.rate ? ingredient.rate.toString() : '',
        tags: ingredient.tags ? ingredient.tags.join(', ') : '',
      });
    } else {
      setFormData({
        name: '',
        short_description: '',
        unit_of_measurement: '',
        rate: '',
        tags: '',
      });
    }
  }, [ingredient, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async (data: IngredientFormData) => {
      const ingredientData = {
        name: data.name,
        short_description: data.short_description || null,
        unit_of_measurement: data.unit_of_measurement || null,
        rate: data.rate ? parseFloat(data.rate) : null,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : null,
        active: true,
      };

      if (ingredient) {
        const { error } = await supabase
          .from('ingredients')
          .update(ingredientData)
          .eq('id', ingredient.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ingredients')
          .insert([ingredientData]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      toast({
        title: "Success",
        description: `Ingredient ${ingredient ? 'updated' : 'created'} successfully`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${ingredient ? 'update' : 'create'} ingredient`,
        variant: "destructive",
      });
      console.error('Error saving ingredient:', error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    
    setIsSubmitting(true);
    
    try {
      await saveMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof IngredientFormData, value: string) => {
    if (isReadOnly) return;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isReadOnly ? 'View Ingredient' : (ingredient ? 'Edit Ingredient' : 'Add New Ingredient')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required={!isReadOnly}
              placeholder="Enter ingredient name"
              readOnly={isReadOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.short_description}
              onChange={(e) => handleInputChange('short_description', e.target.value)}
              placeholder="Enter ingredient description"
              rows={3}
              readOnly={isReadOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit of Measurement</Label>
            {isReadOnly ? (
              <Input
                value={formData.unit_of_measurement || 'Not specified'}
                readOnly
              />
            ) : (
              <Select
                value={formData.unit_of_measurement}
                onValueChange={(value) => handleInputChange('unit_of_measurement', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit of measurement" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate">Rate (per unit)</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              value={formData.rate}
              onChange={(e) => handleInputChange('rate', e.target.value)}
              placeholder="0.00"
              readOnly={isReadOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="Enter tags separated by commas"
              readOnly={isReadOnly}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (ingredient ? 'Update' : 'Create')}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
