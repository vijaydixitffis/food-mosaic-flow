
import React from 'react';
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
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
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
              <Badge variant={recipe.active ? "default" : "secondary"}>
                {recipe.active ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
            <TableCell>
              {(() => {
                const date = new Date(recipe.created_at);
                const day = date.getDate().toString().padStart(2, '0');
                const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                const month = monthNames[date.getMonth()];
                const year = date.getFullYear().toString().slice(-2);
                return `${day}-${month}-${year}`;
              })()}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(recipe)}
                >
                  {isAdmin ? <Edit className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(recipe)}
                  >
                    {recipe.active ? 'Deactivate' : 'Activate'}
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
