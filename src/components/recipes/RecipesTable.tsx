import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Recipe = Database['public']['Tables']['recipes']['Row'] & {
  recipe_instructions?: Database['public']['Tables']['recipe_instructions']['Row'][];
  recipe_products?: Array<{
    product_id: string;
    products: { name: string } | null;
  }>;
  recipe_compounds?: Array<{
    compound_id: string;
    compounds: { name: string } | null;
  }>;
};

interface StatusSliderProps {
  isActive: boolean;
  onToggle: () => void;
  recipeName: string;
  disabled?: boolean;
}

function StatusSlider({ isActive, onToggle, recipeName, disabled = false }: StatusSliderProps) {
  const handleToggle = () => {
    if (disabled) return;
    
    if (isActive) {
      // If currently active and trying to deactivate, show confirmation
      const confirmed = window.confirm(
        `Are you sure you want to deactivate "${recipeName}"? This will make the recipe unavailable for work orders.`
      );
      if (confirmed) {
        onToggle();
      }
    } else {
      // If currently inactive and trying to activate, proceed directly
      onToggle();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          ${isActive 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-gray-200 hover:bg-gray-300'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${isActive ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
}

interface RecipesTableProps {
  recipes: Recipe[];
  onEdit: (recipe: Recipe) => void;
  onRefresh: () => void;
  isAdmin: boolean;
}

export function RecipesTable({ recipes, onEdit, onRefresh, isAdmin }: RecipesTableProps) {
  const { toast } = useToast();

  const handleToggleActive = async (recipe: Recipe) => {
    console.log('Toggling active status for recipe:', recipe.id);
    
    try {
      const { error } = await supabase
        .from('recipes')
        .update({ active: !recipe.active })
        .eq('id', recipe.id);

      if (error) {
        console.error('Error updating recipe:', error);
        toast({
          title: "Error",
          description: "Failed to update recipe status",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Recipe ${recipe.active ? 'deactivated' : 'activated'} successfully`,
      });
      
      onRefresh();
    } catch (error) {
      console.error('Error updating recipe:', error);
      toast({
        title: "Error",
        description: "Failed to update recipe status",
        variant: "destructive",
      });
    }
  };

  if (recipes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No recipes found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Products</TableHead>
          <TableHead>Compounds</TableHead>
          <TableHead>Instructions</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recipes.map((recipe) => (
          <TableRow key={recipe.id}>
            <TableCell className="font-medium">{recipe.name}</TableCell>
            <TableCell>
              <div className="max-w-[200px] truncate" title={recipe.description || ''}>
                {recipe.description || 'No description'}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1 max-w-[150px]">
                {recipe.recipe_products?.map((rp) => (
                  <Badge key={rp.product_id} variant="outline" className="text-xs">
                    {rp.products?.name || 'Unknown Product'}
                  </Badge>
                ))}
                {(!recipe.recipe_products || recipe.recipe_products.length === 0) && (
                  <span className="text-muted-foreground text-sm">No products</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1 max-w-[150px]">
                {recipe.recipe_compounds?.map((rc) => (
                  <Badge key={rc.compound_id} variant="outline" className="text-xs">
                    {rc.compounds?.name || 'Unknown Compound'}
                  </Badge>
                ))}
                {(!recipe.recipe_compounds || recipe.recipe_compounds.length === 0) && (
                  <span className="text-muted-foreground text-sm">No compounds</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {recipe.recipe_instructions?.length || 0} steps
              </span>
            </TableCell>
            <TableCell>
              {new Date(recipe.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-between">
                <StatusSlider
                  isActive={recipe.active}
                  onToggle={() => handleToggleActive(recipe)}
                  recipeName={recipe.name}
                  disabled={!isAdmin}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(recipe)}
                  className="flex items-center gap-1"
                >
                  {isAdmin ? <Edit className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {isAdmin ? 'Edit' : 'View'}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
