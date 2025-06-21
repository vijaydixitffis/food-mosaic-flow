import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import type { WorkOrderFormData } from './WorkOrderDialog';

interface WorkOrderRecipesTabProps {
  formData: WorkOrderFormData;
  workOrder: any;
  onPrevious: () => void;
  onSuccess: () => void;
  onClose: () => void;
  isReadOnly: boolean;
}

interface Recipe {
  id: string;
  name: string;
  description: string | null;
  recipe_instructions: Array<{
    id: string;
    instruction_text: string;
    sequence_number: number;
  }>;
}

export function WorkOrderRecipesTab({
  formData,
  workOrder,
  onPrevious,
  onSuccess,
  onClose,
  isReadOnly,
}: WorkOrderRecipesTabProps) {
  // Fetch recipes for all selected products
  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['work-order-recipes', formData.products.map(p => p.product_id)],
    queryFn: async () => {
      if (formData.products.length === 0) return [];

      const productIds = formData.products.map(p => p.product_id);
      
      const { data, error } = await supabase
        .from('recipe_products')
        .select(`
          recipes:recipe_id (
            id,
            name,
            description,
            recipe_instructions (
              id,
              instruction_text,
              sequence_number
            )
          )
        `)
        .in('product_id', productIds);

      if (error) throw error;

      // Extract unique recipes and sort instructions
      const uniqueRecipes = new Map<string, Recipe>();
      
      data?.forEach(rp => {
        if (rp.recipes) {
          const recipe = rp.recipes as Recipe;
          if (!uniqueRecipes.has(recipe.id)) {
            // Sort instructions by sequence number
            const sortedInstructions = [...recipe.recipe_instructions].sort(
              (a, b) => a.sequence_number - b.sequence_number
            );
            
            uniqueRecipes.set(recipe.id, {
              ...recipe,
              recipe_instructions: sortedInstructions,
            });
          }
        }
      });

      return Array.from(uniqueRecipes.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );
    },
    enabled: formData.products.length > 0,
  });

  // Get product names for display
  const { data: products = [] } = useQuery({
    queryKey: ['products-for-recipes', formData.products.map(p => p.product_id)],
    queryFn: async () => {
      if (formData.products.length === 0) return [];

      const productIds = formData.products.map(p => p.product_id);
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      if (error) throw error;
      return data;
    },
    enabled: formData.products.length > 0,
  });

  const handleSave = async () => {
    try {
      if (workOrder) {
        // Update existing work order
        const { error: updateError } = await supabase
          .from('work_orders')
          .update({
            name: formData.name,
            description: formData.description,
            remarks: formData.remarks,
            status: formData.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', workOrder.id);

        if (updateError) throw updateError;

        // Delete existing products
        const { error: deleteError } = await supabase
          .from('work_order_products')
          .delete()
          .eq('work_order_id', workOrder.id);

        if (deleteError) throw deleteError;

        // Insert updated products
        if (formData.products.length > 0) {
          const { error: insertError } = await supabase
            .from('work_order_products')
            .insert(
              formData.products.map(product => ({
                work_order_id: workOrder.id,
                product_id: product.product_id,
                total_weight: product.total_weight,
                number_of_pouches: product.number_of_pouches,
                pouch_size: product.pouch_size,
              }))
            );

          if (insertError) throw insertError;
        }
      } else {
        // Create new work order
        const { data: newWorkOrder, error: createError } = await supabase
          .from('work_orders')
          .insert({
            name: formData.name,
            description: formData.description,
            remarks: formData.remarks,
            status: formData.status,
          })
          .select()
          .single();

        if (createError) throw createError;

        // Insert products
        if (formData.products.length > 0) {
          const { error: insertError } = await supabase
            .from('work_order_products')
            .insert(
              formData.products.map(product => ({
                work_order_id: newWorkOrder.id,
                product_id: product.product_id,
                total_weight: product.total_weight,
                number_of_pouches: product.number_of_pouches,
                pouch_size: product.pouch_size,
              }))
            );

          if (insertError) throw insertError;
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving work order:', error);
    }
  };

  if (formData.products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-gray-500">
          No products selected. Please add products to view associated recipes.
        </div>
        
        {!isReadOnly && (
          <div className="flex justify-between">
            <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button onClick={handleSave}>
              {workOrder ? 'Update Work Order' : 'Create Work Order'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Associated Recipes</h3>
        <p className="text-sm text-gray-600">
          Recipes that can be used to manufacture the selected products.
        </p>

        {/* Selected Products Summary */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Selected Products:</h4>
          <div className="flex flex-wrap gap-2">
            {formData.products.map((product) => {
              const productInfo = products.find(p => p.id === product.product_id);
              return (
                <Badge key={product.product_id} variant="outline">
                  {productInfo?.name || 'Unknown Product'} ({product.total_weight} kg)
                </Badge>
              );
            })}
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Loading recipes...
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No recipes found for the selected products. You may need to create recipes for these products.
          </div>
        ) : (
          <div className="space-y-4">
            {recipes.map((recipe) => (
              <Card key={recipe.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{recipe.name}</CardTitle>
                  {recipe.description && (
                    <p className="text-sm text-gray-600">{recipe.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {recipe.recipe_instructions.length > 0 ? (
                    <div className="space-y-3">
                      <h5 className="font-medium">Instructions:</h5>
                      <ol className="space-y-2">
                        {recipe.recipe_instructions.map((instruction) => (
                          <li key={instruction.id} className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center text-sm font-medium">
                              {instruction.sequence_number}
                            </span>
                            <span className="text-sm">{instruction.instruction_text}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No instructions available for this recipe.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {!isReadOnly && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
          <Button onClick={handleSave}>
            {workOrder ? 'Update Work Order' : 'Create Work Order'}
          </Button>
        </div>
      )}
    </div>
  );
}
