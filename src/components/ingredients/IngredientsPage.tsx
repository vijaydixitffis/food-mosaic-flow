
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { IngredientsTable } from './IngredientsTable';
import { IngredientDialog } from './IngredientDialog';

export interface Ingredient {
  id: string;
  name: string;
  short_description: string | null;
  unit_of_measurement: string | null;
  rate: number | null;
  tags: string[] | null;
  active: boolean | null;
  created_at: string;
  updated_at: string;
}

export function IngredientsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch ingredients
  const { data: ingredients = [], isLoading, error } = useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Ingredient[];
    },
  });

  // Deactivate ingredient mutation
  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ingredients')
        .update({ active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      toast({
        title: "Success",
        description: "Ingredient deactivated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to deactivate ingredient",
        variant: "destructive",
      });
      console.error('Error deactivating ingredient:', error);
    },
  });

  const handleAddIngredient = () => {
    setEditingIngredient(null);
    setIsDialogOpen(true);
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setIsDialogOpen(true);
  };

  const handleDeactivateIngredient = async (id: string) => {
    if (window.confirm('Are you sure you want to deactivate this ingredient?')) {
      deactivateMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingIngredient(null);
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Error loading ingredients: {error.message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Manage Ingredients</h1>
        <Button onClick={handleAddIngredient} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Ingredient
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingredients List</CardTitle>
        </CardHeader>
        <CardContent>
          <IngredientsTable
            ingredients={ingredients}
            isLoading={isLoading}
            onEdit={handleEditIngredient}
            onDeactivate={handleDeactivateIngredient}
          />
        </CardContent>
      </Card>

      <IngredientDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        ingredient={editingIngredient}
      />
    </div>
  );
}
